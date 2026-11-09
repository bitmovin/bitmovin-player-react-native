import ExpoModulesCore
import Foundation

public final class SharedCallbackResult: SharedObject {
    private let scope: CallbackScope
    private var completion: ((Any?) -> Void)?

    init(scope: CallbackScope, completion: @escaping (Any?) -> Void) {
        self.scope = scope
        self.completion = completion
        super.init()
    }

    func resolve(_ value: Any?) {
        scope.condition.lock()
        guard let completion else { scope.condition.unlock(); return }
        self.completion = nil
        let result = scope.isClosed ? nil : value
        scope.condition.unlock()
        DispatchQueue.global().async { completion(result) }
    }

    deinit {
        resolve(nil)
    }

    override public func sharedObjectWillRelease() {
        resolve(nil)
    }
}
