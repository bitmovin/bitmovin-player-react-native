import Foundation

internal class LockedBox<T> {
    private let lock = NSRecursiveLock()
    var value: T {
        lock.withLock {
            _value
        }
    }
    private var _value: T

    init(value: T) {
        self._value = value
    }

    func update(_ value: T) {
        lock.withLock {
            self._value = value
        }
    }

    func update(_ updateBlock: (inout T) -> Void) {
        lock.withLock {
            updateBlock(&self._value)
        }
    }
}
