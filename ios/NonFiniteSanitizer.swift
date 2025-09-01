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
    private static func sanitize(_ value: Any) -> Any {
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

private extension Float {
    // Helper to convert non-finite doubles to sentinel strings
    func toSentinel() -> String {
        switch self {
        case .infinity:
            return "Infinity"
        case -.infinity:
            return "-Infinity"
        default:
            return "NaN"
        }
    }
}

private extension Double {
    // Helper to convert non-finite doubles to sentinel strings
    func toSentinel() -> String {
        switch self {
        case .infinity:
            return "Infinity"
        case -.infinity:
            return "-Infinity"
        default:
            return "NaN"
        }
    }
}
