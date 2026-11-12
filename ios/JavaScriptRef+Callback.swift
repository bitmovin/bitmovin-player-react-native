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
            reply.complete(.success(invoke()))
        }
        return reply.wait(until: Date(timeIntervalSinceNow: 0.25))
    }

    /// The completion overload matches the Apple SDK's asynchronous HTTP callback contract.
    @discardableResult
    func callAsync<R>(
        _ context: AppContext,
        arguments: [Any],
        convert: @escaping @JavaScriptActor (JavaScriptValue) throws -> R?,
        completion: @escaping (R?) -> Void
    ) -> CallbackCompletion<R> {
        let reply = CallbackCompletion<R> { completion(try? $0.get()) }
        start(context, arguments: arguments, convert: convert, reply: reply)
        return reply
    }

    func callAsync<R: Sendable>(
        _ context: AppContext,
        arguments: [Any],
        convert: @escaping @JavaScriptActor (JavaScriptValue) throws -> R?
    ) async throws -> R? {
        guard let runtime = try? context.runtime,
              let value = try await awaitValue(context, arguments: arguments) else { return nil }
        try Task.checkCancellation()
        return try await runtime.execute { try convert(value) }
    }

    /// Uses Expo's argument conversion before mapping a typed callback result on JS.
    func callBlocking<Input: AnyArgument, R>(
        _ context: AppContext,
        arguments: [Any],
        convert: @escaping @JavaScriptActor (Input) throws -> R?
    ) -> R? {
        callBlocking(context, arguments: arguments) { (value: JavaScriptValue) in
            try (Input.getDynamicType().cast(jsValue: value, appContext: context) as? Input).flatMap(convert)
        }
    }

    @discardableResult
    func callAsync<Input: AnyArgument, R>(
        _ context: AppContext,
        arguments: [Any],
        convert: @escaping @JavaScriptActor (Input) throws -> R?,
        completion: @escaping (R?) -> Void
    ) -> CallbackCompletion<R> {
        callAsync(
            context,
            arguments: arguments,
            convert: { (value: JavaScriptValue) in
                try (Input.getDynamicType().cast(jsValue: value, appContext: context) as? Input).flatMap(convert)
            },
            completion: completion
        )
    }

    func callAsync<Input: AnyArgument, R: Sendable>(
        _ context: AppContext,
        arguments: [Any],
        convert: @escaping @JavaScriptActor (Input) throws -> R?
    ) async throws -> R? {
        try await callAsync(context, arguments: arguments) { (value: JavaScriptValue) in
            try (Input.getDynamicType().cast(jsValue: value, appContext: context) as? Input).flatMap(convert)
        }
    }

    /// Notifications ignore their return value, consuming a rejected Promise without awaiting it.
    func notify(_ context: AppContext, arguments: [Any]) {
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

    private func awaitValue(_ context: AppContext, arguments: [Any]) async throws -> JavaScriptValue? {
        try Task.checkCancellation()
        let runtime = try context.runtime
        do {
            let pending = try await runtime.execute {
                guard let value = try self.invoke(context, arguments: arguments) else {
                    return nil as (JavaScriptPromise.Ref, JavaScriptPromise.Ref)?
                }
                // Race a native-owned rejection signal so Task cancellation also ends Expo's await.
                let cancellation = try JavaScriptPromise(runtime)
                let values = JavaScriptArray(runtime, items: [value, cancellation.asValue()])
                let constructor = try runtime.global().getPropertyAsObject("Promise")
                let promise = try constructor.callFunction("race", arguments: values.asValue()).getPromise()
                return (cancellation.ref(), promise.ref())
            }
            guard let pending else { return nil }
            let (cancellation, result) = pending
            return try await withTaskCancellationHandler {
                let promise: JavaScriptPromise = try result.take()
                do { return try await promise.await() } catch {
                    try Task.checkCancellation()
                    throw error
                }
            } onCancel: {
                cancellation.withValue { $0?.reject(CancellationError()) }
            }
        } catch let error as JavaScriptError {
            try Task.checkCancellation()
            let message = try await runtime.execute { error.toValue().toString() }
            throw Exception(name: "JavaScriptCallbackError", description: message)
        }
    }

    private func start<R>(
        _ context: AppContext,
        arguments: [Any],
        convert: @escaping @JavaScriptActor (JavaScriptValue) throws -> R?,
        reply: CallbackCompletion<R>
    ) {
        guard let runtime = try? context.runtime else { reply.cancel(); return }
        runtime.schedule {
            guard !reply.isComplete else { return }
            runtime.longLivedObjects.add(reply)
            reply.didComplete { [weak runtime, weak reply] in
                runtime?.schedule {
                    if let reply { runtime?.longLivedObjects.remove(reply) }
                }
            }
        }
        let task = Task {
            do {
                guard !reply.isComplete else { return }
                let value = try await self.awaitValue(context, arguments: arguments)
                runtime.schedule {
                    guard !reply.isComplete else { return }
                    reply.complete(Result { try value.flatMap(convert) })
                }
            } catch {
                reply.complete(.failure(error))
            }
        }
        reply.didComplete { task.cancel() }
    }
}

/// One SDK completion; cancellation and duplicate/late JS replies all settle it at most once.
internal protocol CancellableCallback: AnyObject {
    var isComplete: Bool { get }
    func cancel()
    func didComplete(_ completion: @escaping () -> Void)
}

nonisolated internal final class CallbackCompletion<R>: CancellableCallback, LongLivedObject, @unchecked Sendable {
    private let condition = NSCondition()
    private var result: Result<R?, Error>?
    private var completion: ((Result<R?, Error>) -> Void)?
    private var finished: [() -> Void] = []
    var isComplete: Bool { condition.lock(); defer { condition.unlock() }; return result != nil }

    init(completion: ((Result<R?, Error>) -> Void)? = nil) { self.completion = completion }

    func didComplete(_ completion: @escaping () -> Void) {
        condition.lock()
        if result != nil { condition.unlock(); completion() } else {
            finished.append(completion)
            condition.unlock()
        }
    }

    func complete(_ result: Result<R?, Error>) {
        condition.lock()
        guard self.result == nil else { condition.unlock(); return }
        self.result = result
        let completion = self.completion
        let finished = self.finished
        self.completion = nil
        self.finished.removeAll()
        condition.broadcast()
        condition.unlock()
        completion?(result)
        finished.forEach { $0() }
    }

    func cancel() { complete(.failure(CancellationError())) }
    @JavaScriptActor
    func allowRelease() { cancel() }

    func wait(until deadline: Date) -> R? {
        condition.lock()
        while result == nil {
            if !condition.wait(until: deadline) { break }
        }
        let result = result
        condition.unlock()
        cancel()
        return result.flatMap { try? $0.get() }
    }
}
