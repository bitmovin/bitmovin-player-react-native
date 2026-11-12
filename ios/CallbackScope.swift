import ExpoModulesCore
import ExpoModulesJSI
import Foundation

/// Owns weak configuration references and cancels native waits when the peer closes.
nonisolated internal final class CallbackScope: LongLivedObject {
    private let condition = NSCondition()
    private weak var context: AppContext?
    private weak var runtime: JavaScriptRuntime?
    private var closed = false
    private var references: [JavaScriptRef<JavaScriptWeakObject>] = []
    private var pending: [CallbackReply] = []
    private var configuration: [String: Any]?
    private let captureAdvertising: Bool

    init(config: JavaScriptValue?, context: AppContext?, captureAdvertising: Bool = false) throws {
        self.captureAdvertising = captureAdvertising
        guard let context else { throw Exceptions.AppContextLost() }
        self.context = context
        let runtime = try context.runtime
        self.runtime = runtime
        try runtime.execute {
            runtime.longLivedObjects.add(self)
            do {
                if let config, config.isObject() {
                    let root = config.getObject().createWeak().ref()
                    self.references.append(root)
                    self.configuration = try self.snapshot(config, root: root) as? [String: Any]
                }
            } catch let error as JavaScriptError {
                self.close()
                throw Exception(name: "JavaScriptConfigurationError", description: error.toValue().toString())
            } catch {
                self.close()
                throw error
            }
        }
    }

    /// Only native data and weak callback handles escape the JS-thread constructor.
    func takeConfiguration() -> [String: Any]? {
        defer { configuration = nil }
        return configuration
    }

    @JavaScriptActor
    func allowRelease() {
        close()
        releaseReferences()
    }

    func close() {
        condition.lock()
        guard !closed else { condition.unlock(); return }
        closed = true
        let cancelled = pending
        pending.removeAll()
        condition.broadcast()
        condition.unlock()
        cancelled.forEach { $0.complete(.failure(CancellationError())) }
        runtime?.schedule { self.releaseReferences() }
    }

    @JavaScriptActor
    private func releaseReferences() {
        references.forEach { $0.release() }
        references.removeAll()
        runtime?.longLivedObjects.remove(self)
    }

    @JavaScriptActor
    private func snapshot(
        _ value: JavaScriptValue, root: JavaScriptRef<JavaScriptWeakObject>, path: [String] = [], captured: Bool = false
    ) throws -> Any? {
        if value.isUndefined() { return nil }
        if value.isArray() {
            let array = value.getArray()
            return try (0..<array.length).map {
                try snapshot(array.getValue(at: $0), root: root, path: path + [String($0)], captured: captured)
                    ?? NSNull()
            }
        }
        guard value.isObject() else { return value.getAny() }
        let object = value.getObject()
        var result: [String: Any] = [:]
        for key in object.getPropertyNames() {
            let property = object.getProperty(key)
            if property.isFunction() {
                let reference = captured ? property.getObject().createWeak().ref() : root
                if captured { references.append(reference) }
                result[key] = JavaScriptCallback(scope: self, owner: reference, path: captured ? nil : path + [key])
            } else {
                result[key] = try snapshot(
                    property,
                    root: root,
                    path: path + [key],
                    captured: captured || (captureAdvertising && key == "advertisingConfig")
                )
            }
        }
        return result
    }

    fileprivate func call(_ callback: JavaScriptCallback, arguments: [Any], mutating: Bool) -> Any? {
        let result = SyncReply()
        schedule(callback, arguments: arguments, mutating: mutating) { value in
            self.condition.lock()
            if !result.completed {
                result.value = value
                result.completed = true
                self.condition.broadcast()
            }
            self.condition.unlock()
        }
        condition.lock()
        let deadline = Date(timeIntervalSinceNow: 0.25)
        while !result.completed && !closed {
            if !condition.wait(until: deadline) { break }
        }
        let value = closed ? nil : result.value
        result.completed = true
        result.value = nil
        condition.unlock()
        return value
    }

    fileprivate func notify(_ callback: JavaScriptCallback, arguments: [Any]) {
        schedule(callback, arguments: arguments, mutating: false) { _ in }
    }

    private func schedule(
        _ callback: JavaScriptCallback,
        arguments: [Any],
        mutating: Bool,
        completion: @escaping (Any?) -> Void
    ) {
        guard let runtime else {
            completion(nil)
            return
        }
        let invoke: @JavaScriptActor () -> sending Void = {
            do {
                guard let value = try self.invoke(callback, arguments: arguments, mutating: mutating) else {
                    completion(nil)
                    return
                }
                if value.isObject(), value.getObject().getProperty("then").isFunction() {
                    let ignore = runtime.createFunction { _, _ in JavaScriptValue.undefined }
                    try value.getObject().callFunction("then", arguments: ignore.asValue(), ignore.asValue())
                    completion(nil)
                } else {
                    completion(value.getAny())
                }
            } catch {
                completion(nil)
            }
        }
        // SDK callbacks can re-enter while JS calls a synchronous native method.
        if runtime.isOnJavaScriptThread() {
            try? runtime.execute { invoke() }
        } else {
            runtime.schedule { invoke() }
        }
    }

    fileprivate func request(
        _ callback: JavaScriptCallback,
        arguments: [Any],
        completion: @escaping (Any?) -> Void
    ) {
        let reply = CallbackReply { completion(try? $0.get()) }
        condition.lock()
        let active = !closed
        if active { pending.append(reply) }
        condition.unlock()
        guard active, let runtime else {
            finish(reply, .failure(CancellationError()))
            return
        }
        runtime.schedule {
            do {
                guard !reply.isComplete,
                    let value = try self.invoke(callback, arguments: arguments, mutating: false)
                else {
                    self.finish(reply, .failure(CancellationError()))
                    return
                }
                if value.isObject(), value.getObject().getProperty("then").isFunction() {
                    let resolve = runtime.createFunction { _, values in
                        guard !reply.isComplete else { return JavaScriptValue.undefined }
                        self.finish(reply, .success(values.firstValue.getAny()))
                        return JavaScriptValue.undefined
                    }
                    let reject = runtime.createFunction { _, values in
                        guard !reply.isComplete else { return JavaScriptValue.undefined }
                        let error = Exception(
                            name: "JavaScriptCallbackError",
                            description: values.firstValue.toString()
                        )
                        self.finish(reply, .failure(error))
                        return JavaScriptValue.undefined
                    }
                    try value.getObject().callFunction("then", arguments: resolve.asValue(), reject.asValue())
                } else {
                    self.finish(reply, .success(value.getAny()))
                }
            } catch let error as JavaScriptError {
                self.finish(
                    reply, .failure(Exception(name: "JavaScriptCallbackError", description: error.toValue().toString()))
                )
            } catch {
                self.finish(reply, .failure(error))
            }
        }
    }

    private func finish(_ reply: CallbackReply, _ result: Result<Any?, Error>) {
        condition.lock()
        pending.removeAll { $0 === reply }
        let result = closed ? .failure(CancellationError()) : result
        condition.unlock()
        reply.complete(result)
    }

    @JavaScriptActor
    private func invoke(_ callback: JavaScriptCallback, arguments: [Any], mutating: Bool) throws -> JavaScriptValue? {
        condition.lock()
        let active = !closed
        condition.unlock()
        guard active, let context, let runtime else { return nil }
        return try callback.owner.withValue { reference in
            guard let root = reference?.lock() else { return nil }
            var receiver = root.asValue()
            if let path = callback.path {
                for key in path.dropLast() {
                    guard receiver.isObject() else { return nil }
                    receiver = receiver.getObject().getProperty(key)
                }
            }
            guard receiver.isObject() else { return nil }
            let owner = receiver.getObject()
            let function = callback.path?.last.map { owner.getProperty($0) } ?? owner.asValue()
            guard function.isFunction() else { return nil }
            let array = try [Any].getDynamicType().castToJS(arguments, appContext: context, in: runtime).getArray()
            let values = try (0..<array.length).map { try array.getValue(at: $0) }
            let buffer = JavaScriptValuesBuffer.copying(in: runtime, values: values)
            let result =
                try callback.path == nil
                ? function.getFunction().call(arguments: buffer)
                : function.getFunction().call(this: owner, arguments: buffer)
            if mutating, let first = values.first, first.isObject(),
                !(result.isObject() && result.getObject().getProperty("then").isFunction()) {
                if result.isObject(), !result.isFunction() {
                    let returned = result.getObject()
                    for key in returned.getPropertyNames() {
                        first.getObject().setProperty(key, value: returned.getProperty(key))
                    }
                }
                return first
            }
            return result
        }
    }

    private final class SyncReply {
        var completed = false
        var value: Any?
    }
}

internal final class JavaScriptCallback {
    private let scope: CallbackScope
    fileprivate let owner: JavaScriptRef<JavaScriptWeakObject>
    fileprivate let path: [String]?
    fileprivate init(scope: CallbackScope, owner: JavaScriptRef<JavaScriptWeakObject>, path: [String]?) {
        self.scope = scope
        self.owner = owner
        self.path = path
    }
    func call(arguments: [Any], mutating: Bool = false) -> Any? {
        scope.call(self, arguments: arguments, mutating: mutating)
    }
    func notify(arguments: [Any]) { scope.notify(self, arguments: arguments) }
    func request(arguments: [Any], completion: @escaping (Any?) -> Void) {
        scope.request(self, arguments: arguments, completion: completion)
    }
}

fileprivate extension JavaScriptValuesBuffer {
    var firstValue: JavaScriptValue {
        // This non-Collection buffer has no isEmpty accessor.
        // swiftlint:disable:next empty_count
        count == 0 ? .undefined : self[0]
    }
}

private final class CallbackReply {
    private let lock = NSLock()
    private var completion: ((Result<Any?, Error>) -> Void)?
    init(_ completion: @escaping (Result<Any?, Error>) -> Void) { self.completion = completion }
    var isComplete: Bool {
        lock.lock()
        defer { lock.unlock() }
        return completion == nil
    }
    func complete(_ result: Result<Any?, Error>) {
        lock.lock()
        let completion = self.completion
        self.completion = nil
        lock.unlock()
        completion?(result)
    }
}
