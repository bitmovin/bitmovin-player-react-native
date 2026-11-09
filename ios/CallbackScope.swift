import ExpoModulesCore
import ExpoModulesJSI
import Foundation

/// Owns the JS dispatcher and one cancellation condition, never a table of callback requests.
nonisolated internal final class CallbackScope: LongLivedObject {
    let condition = NSCondition()
    var isClosed: Bool { function == nil }
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
        let function = self.function
        self.function = nil
        condition.broadcast()
        condition.unlock()
        guard let function else { return }
        if let runtime {
            try? runtime.execute {
                function.release()
                runtime.longLivedObjects.remove(self)
            }
        }
    }

    func call(_ operation: String, arguments: [Any], timeout: TimeInterval = 0.25, mutating: Bool = false) -> Any? {
        let result = CallbackReturn()
        dispatch(operation, arguments: arguments, mutating: mutating) { value in
            self.condition.lock()
            if !result.isComplete {
                result.value = value
                result.isComplete = true
                self.condition.broadcast()
            }
            self.condition.unlock()
        }
        condition.lock()
        let deadline = Date(timeIntervalSinceNow: timeout)
        while !result.isComplete && !isClosed {
            if !condition.wait(until: deadline) { break }
        }
        let value = isClosed ? nil : result.value
        result.isComplete = true
        result.value = nil
        condition.unlock()
        return value
    }

    func request(
        _ operation: String,
        arguments: [Any],
        fallbackArgument: Int? = nil,
        completion: @escaping (Any?) -> Void
    ) {
        let result = SharedCallbackResult(scope: self, completion: completion)
        dispatch(operation, arguments: arguments, result: result, fallbackArgument: fallbackArgument)
    }

    func notify(_ operation: String, arguments: [Any]) {
        dispatch(operation, arguments: arguments)
    }

    private func dispatch(
        _ operation: String,
        arguments: [Any],
        result: SharedCallbackResult? = nil,
        mutating: Bool = false,
        fallbackArgument: Int? = nil,
        completion: ((Any?) -> Void)? = nil
    ) {
        guard let runtime, let context else { result?.resolve(nil); completion?(nil); return }
        runtime.schedule { [weak self, weak context] in
            guard let self, let context else { result?.resolve(nil); completion?(nil); return }
            self.condition.lock()
            let function = self.function
            self.condition.unlock()
            guard let function else { result?.resolve(nil); completion?(nil); return }
            do {
                let values = try [Any].getDynamicType().castToJS(arguments, appContext: context, in: runtime)
                let reply = try result.map {
                    try SharedCallbackResult.getDynamicType().castToJS($0, appContext: context, in: runtime)
                } ?? JavaScriptValue.undefined
                let value = try function.withValue { callback in
                    try callback?.call(arguments: JavaScriptValuesBuffer.copying(in: runtime, values: [
                        JavaScriptValue(runtime, operation), values, reply, JavaScriptValue(runtime, mutating),
                        fallbackArgument.map { JavaScriptValue(runtime, $0) } ?? JavaScriptValue.undefined
                    ]))
                }
                completion?(value?.getAny())
            } catch {
                result?.resolve(nil)
                completion?(nil)
            }
        }
    }

    private final class CallbackReturn {
        var isComplete = false
        var value: Any?
    }
}
