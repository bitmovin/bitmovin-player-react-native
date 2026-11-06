import ExpoModulesCore
import ExpoModulesJSI
import Foundation

public class NativeCallbacksModule: Module {
    public func definition() -> ModuleDefinition {
        Name("NativeCallbacksModule")
        Class("CallbackResult", SharedCallbackResult.self) {
            Function("resolve") { (result: SharedCallbackResult, value: JavaScriptValue) in
                result.resolve(value.getAny())
            }
        }
    }
}

/// Owns the JS dispatcher and one cancellation condition, never a table of callback requests.
nonisolated internal final class CallbackScope: LongLivedObject {
    let condition = NSCondition()
    private(set) var isClosed = false
    private weak var context: AppContext?
    private weak var runtime: JavaScriptRuntime?
    private var function: JavaScriptRef<JavaScriptFunction>?

    init(callback: JavaScriptValue, context: AppContext?) throws {
        guard let context else { throw Exceptions.AppContextLost() }
        self.context = context
        let runtime = try context.runtime
        self.runtime = runtime
        try runtime.execute {
            self.function = callback.getFunction().ref()
            runtime.longLivedObjects.add(self)
        }
    }

    @JavaScriptActor
    func allowRelease() {
        close()
    }

    func close() {
        condition.lock()
        guard !isClosed else { condition.unlock(); return }
        isClosed = true
        condition.broadcast()
        condition.unlock()
        if let runtime {
            try? runtime.execute {
                self.function?.release()
                self.function = nil
                runtime.longLivedObjects.remove(self)
            }
        } else {
            function = nil
        }
    }

    func call(_ operation: String, arguments: [Any], timeout: TimeInterval = 0.25) -> Any? {
        let result = SharedCallbackResult(scope: self)
        dispatch(operation, arguments: arguments, result: result)
        condition.lock()
        let deadline = Date(timeIntervalSinceNow: timeout)
        while !result.isComplete && !isClosed {
            if !condition.wait(until: deadline) { break }
        }
        let value = isClosed ? nil : result.value
        condition.unlock()
        result.resolve(nil)
        return value
    }

    func request(_ operation: String, arguments: [Any], completion: @escaping (Any?) -> Void) {
        let result = SharedCallbackResult(scope: self, completion: completion)
        dispatch(operation, arguments: arguments, result: result)
    }

    func notify(_ operation: String, arguments: [Any]) {
        dispatch(operation, arguments: arguments, result: nil)
    }

    private func dispatch(_ operation: String, arguments: [Any], result: SharedCallbackResult?) {
        guard let runtime, let context else { result?.resolve(nil); return }
        runtime.schedule { [weak self, weak context] in
            guard let self, let context else { result?.resolve(nil); return }
            self.condition.lock()
            let isClosed = self.isClosed
            self.condition.unlock()
            guard !isClosed, let function = self.function else { result?.resolve(nil); return }
            do {
                let values = try [Any].getDynamicType().castToJS(arguments, appContext: context, in: runtime)
                let reply = try result.map {
                    try SharedCallbackResult.getDynamicType().castToJS($0, appContext: context, in: runtime)
                } ?? JavaScriptValue.undefined
                try function.withValue { callback in
                    try callback?.call(arguments: JavaScriptValuesBuffer.copying(in: runtime, values: [
                        JavaScriptValue(runtime, operation), values, reply
                    ]))
                }
            } catch {
                result?.resolve(nil)
            }
        }
    }
}

public final class SharedCallbackResult: SharedObject {
    private let scope: CallbackScope
    fileprivate var isComplete = false
    fileprivate var value: Any?
    private var completion: ((Any?) -> Void)?

    fileprivate init(scope: CallbackScope, completion: ((Any?) -> Void)? = nil) {
        self.scope = scope
        self.completion = completion
        super.init()
    }

    func resolve(_ value: Any?) {
        scope.condition.lock()
        guard !isComplete else { scope.condition.unlock(); return }
        isComplete = true
        self.value = scope.isClosed ? nil : value
        let completion = completion
        self.completion = nil
        let result = self.value
        scope.condition.broadcast()
        scope.condition.unlock()
        if let completion {
            DispatchQueue.global().async { completion(result) }
        }
    }

    deinit {
        resolve(nil)
    }

    override public func sharedObjectWillRelease() {
        resolve(nil)
    }
}
