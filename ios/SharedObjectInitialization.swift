import ExpoModulesCore
import Foundation

/// SDK factories are synchronous on main; JavaScript starts them through AsyncFunction.
internal final class SharedObjectInitialization<Value> {
    private var factory: (() throws -> Value)?
    private var result: Result<Value, Error>?

    init(_ factory: @escaping () throws -> Value) { self.factory = factory }

    init(value: Value) { result = .success(value) }

    func get() throws -> Value {
        guard Thread.isMainThread else {
            throw Exception(name: "InvalidThread", description: "SDK objects must be accessed on the main thread")
        }
        if let result { return try result.get() }
        guard let factory else {
            throw Exception(name: "DestroyedObject", description: "SDK initializer is no longer available")
        }
        let result = Result(catching: factory)
        self.result = result
        self.factory = nil
        return try result.get()
    }

    var initializedValue: Value? { try? result?.get() }

    func cancel() {
        guard result == nil else { return }
        factory = nil
        result = .failure(Exception(name: "DestroyedObject", description: "Destroyed before SDK initialization"))
    }
}
