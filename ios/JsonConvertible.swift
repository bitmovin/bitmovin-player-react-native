import Foundation

internal protocol JsonConvertible {
    func toJSON() -> [AnyHashable: Any]
}
