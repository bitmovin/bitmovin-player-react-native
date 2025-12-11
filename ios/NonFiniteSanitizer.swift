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
            guard doubleValue.isFinite else { return doubleValue.toSentinel() }
            return doubleValue
        case let floatValue as Float:
            guard floatValue.isFinite else { return floatValue.toSentinel() }
            return floatValue
        case let number as NSNumber:
            guard !number.isBoolean else { return number }
            return sanitize(number.doubleValue)
        case let time as CMTime:
            return time.toSanitizedValue()
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

private extension CMTime {
    /// Converts CMTime to a sanitized number or sentinel string,
    /// using the same rules as `Double.toSentinel()`.
    func toSanitizedValue() -> Any {
        if !isValid {
            return "\(sentinelPrefix)Invalid"
        }
        if isIndefinite {
            return "\(sentinelPrefix)Indefinite"
        }
        if isPositiveInfinity {
            return "\(sentinelPrefix)Infinity"
        }
        if isNegativeInfinity {
            return "\(sentinelPrefix)-Infinity"
        }

        let seconds = CMTimeGetSeconds(self)
        return NonFiniteSanitizer.sanitize(seconds)
    }
}
