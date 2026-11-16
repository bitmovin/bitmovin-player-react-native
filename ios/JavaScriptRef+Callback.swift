import ExpoModulesCore
import ExpoModulesJSI
import Foundation

/// Read a configured function on JS; native SDK closures retain only the standard weak handle.
@JavaScriptActor
internal func weakCallback(_ config: JavaScriptValue?, _ key: String) -> JavaScriptRef<JavaScriptWeakObject>? {
    guard let config, config.isObject() else { return nil }
    let value = config.getObject().getProperty(key)
    return value.isFunction() ? value.getObject().createWeak().ref() : nil
}

internal extension JavaScriptValue {
    @JavaScriptActor
    func property(_ key: String) -> JavaScriptValue? {
        guard isObject() else { return nil }
        let value = getObject().getProperty(key)
        return value.isUndefined() ? nil : value
    }
}

internal extension JavaScriptRef where T == JavaScriptWeakObject {
    /// An SDK decision must finish immediately on JS; an off-JS caller waits at most 250 ms.
    func callBlocking<R>(
        _ context: AppContext,
        arguments: [Any],
        convert: @escaping @JavaScriptActor (JavaScriptValue) throws -> R?
    ) -> R? {
        guard let runtime = try? context.runtime else { return nil }
        let invoke: @JavaScriptActor () -> R? = {
            guard let result = try? self.invoke(context, arguments: arguments) else { return nil }
            return try? convert(result)
        }
        if runtime.isOnJavaScriptThread() { return JavaScriptActor.assumeIsolated { invoke() } }
        let reply = CallbackCompletion<R>()
        runtime.schedule {
            guard !reply.isComplete else { return }
            reply.complete(invoke())
        }
        return reply.wait(timeout: 0.25)
    }

    /// Matches the Apple SDK's asynchronous HTTP completion contract.
    func callAsync<R>(
        _ context: AppContext,
        arguments: [Any],
        convert: @escaping @JavaScriptActor (JavaScriptValue) throws -> R?,
        completion: @escaping (R?) -> Void
    ) -> CallbackCompletion<R> {
        let reply = CallbackCompletion(convert: convert, completion: completion)
        guard let runtime = try? context.runtime else { reply.cancel(); return reply }
        runtime.schedule {
            guard !reply.isComplete else { return }
            runtime.longLivedObjects.add(reply)
            reply.didComplete { [weak runtime, weak reply] in
                runtime?.schedule {
                    if let reply { runtime?.longLivedObjects.remove(reply) }
                }
            }
            do {
                guard let value = try self.invoke(context, arguments: arguments) else { reply.cancel(); return }
                let resolve = runtime.createFunction { _, values in
                    // swiftlint:disable:next empty_count
                    reply.resolve(values.count > 0 ? values[0] : .undefined)
                    return JavaScriptValue.undefined
                }
                let reject = runtime.createFunction { _, _ in
                    reply.cancel()
                    return JavaScriptValue.undefined
                }
                let constructor = try runtime.global().getPropertyAsObject("Promise")
                let promise = try constructor.callFunction("resolve", arguments: value)
                try promise.getObject().callFunction("then", arguments: resolve.asValue(), reject.asValue())
            } catch {
                reply.cancel()
            }
        }
        return reply
    }

    /// Notifications ignore their return value, consuming a rejected Promise without awaiting it.
    func emit(_ context: AppContext, arguments: [Any]) {
        guard let runtime = try? context.runtime else { return }
        runtime.schedule {
            guard let result = try? self.invoke(context, arguments: arguments), result.isObject(),
                  result.getObject().getProperty("then").isFunction() else { return }
            let ignore = runtime.createFunction { _, _ in JavaScriptValue.undefined }
            _ = try? result.getObject().callFunction("then", arguments: ignore.asValue(), ignore.asValue())
        }
    }

    @JavaScriptActor
    private func invoke(_ context: AppContext, arguments: [Any]) throws -> JavaScriptValue? {
        try withValue { reference in
            guard let function = reference?.lock() else { return nil }
            let runtime = try context.runtime
            let array = try [Any].getDynamicType().castToJS(arguments, appContext: context, in: runtime).getArray()
            let values = try (0..<array.length).map { try array.getValue(at: $0) }
            let buffer = JavaScriptValuesBuffer.copying(in: runtime, values: values)
            return try function.getFunction().call(arguments: buffer)
        }
    }
}

/// One SDK completion; cancellation and duplicate/late JS replies all settle it at most once.
internal protocol CancellableCallback: AnyObject {
    func cancel()
    func didComplete(_ completion: @escaping () -> Void)
}

nonisolated internal final class CallbackCompletion<R>: CancellableCallback, LongLivedObject, @unchecked Sendable {
    private let condition = NSCondition()
    private var completed = false
    private var value: R?
    private var completion: ((R?) -> Void)?
    private var convert: (@JavaScriptActor (JavaScriptValue) throws -> R?)?
    private var finished: [() -> Void] = []
    var isComplete: Bool { condition.lock(); defer { condition.unlock() }; return completed }

    init(
        convert: (@JavaScriptActor (JavaScriptValue) throws -> R?)? = nil,
        completion: ((R?) -> Void)? = nil
    ) {
        self.convert = convert
        self.completion = completion
    }

    @JavaScriptActor
    func resolve(_ value: JavaScriptValue) {
        condition.lock()
        let convert = self.convert
        condition.unlock()
        guard let convert else { return }
        complete(try? convert(value))
    }

    func didComplete(_ completion: @escaping () -> Void) {
        condition.lock()
        if completed { condition.unlock(); completion() } else {
            finished.append(completion)
            condition.unlock()
        }
    }

    func complete(_ value: R?) {
        condition.lock()
        guard !completed else { condition.unlock(); return }
        completed = true
        if completion == nil { self.value = value }
        let completion = self.completion
        let finished = self.finished
        self.completion = nil
        self.convert = nil
        self.finished.removeAll()
        condition.broadcast()
        condition.unlock()
        completion?(value)
        finished.forEach { $0() }
    }

    func cancel() { complete(nil) }
    @JavaScriptActor
    func allowRelease() { cancel() }

    func wait(timeout: TimeInterval) -> R? {
        let deadline = Date(timeIntervalSinceNow: timeout)
        condition.lock()
        while !completed {
            if !condition.wait(until: deadline) { break }
        }
        let timedOut = !completed
        let value = value
        condition.unlock()
        cancel()
        if timedOut { log.error("JavaScript callback timed out after \(Int(timeout * 1_000)) ms") }
        return value
    }
}
