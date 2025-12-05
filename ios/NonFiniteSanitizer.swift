import CoreMedia
import Foundation

internal enum NonFiniteSanitizer {
    /// Type-safe method specifically for event data dictionaries.
    /// Sanitizes event data while preserving type safety.
    static func sanitizeEventData(_ eventData: [String: Any]) -> [String: Any] {
        eventData.reduce(into: [:]) {
            $0[$1.key] = sanitize($1.value)
        }
    }

    // Keep existing generic method for backward compatibility
    static func sanitize(_ value: Any) -> Any {
        switch value {
        case let doubleValue as Double:
            guard doubleValue.isInfinite else { return doubleValue }
            return doubleValue.toSentinel()
        case let floatValue as Float:
            guard floatValue.isInfinite else { return floatValue }
            return floatValue.toSentinel()
        case let dict as [AnyHashable: Any]:
            return dict.reduce(into: [:]) {
                $0[$1.key] = sanitize($1.value)
            }
        case let array as [Any]:
            return array.map { sanitize($0) }
        default:
            return value
        }
    }
}

extension CMTime {
    var safeSeconds: Double? {
        guard isNumeric else {
            return nil
        }

        let seconds = CMTimeGetSeconds(self)
        guard seconds.isFinite, !seconds.isNaN else {
            return nil
        }

        return seconds
    }
}

extension NSNumber {
    var safeNumber: Double? {
        guard !isBoolean else {
            return nil
        }

        let value = doubleValue
        guard value.isFinite else {
            return nil
        }

        return value
    }
}

private let sentinelPrefix = "BMP_"

private extension Float {
    // Helper to convert non-finite doubles to sentinel strings
    func toSentinel() -> String {
        switch self {
        case .infinity:
            return "\(sentinelPrefix)Infinity"
        case -.infinity:
            return "\(sentinelPrefix)-Infinity"
        default:
            return "\(sentinelPrefix)NaN"
        }
    }
}

private extension Double {
    // Helper to convert non-finite doubles to sentinel strings
    func toSentinel() -> String {
        switch self {
        case .infinity:
            return "\(sentinelPrefix)Infinity"
        case -.infinity:
            return "\(sentinelPrefix)-Infinity"
        default:
            return "\(sentinelPrefix)NaN"
        }
    }
}

private extension NSNumber {
    var isBoolean: Bool {
        CFGetTypeID(self) == CFBooleanGetTypeID()
    }
}
