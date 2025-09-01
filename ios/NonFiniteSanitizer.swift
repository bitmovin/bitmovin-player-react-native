import Foundation

enum NonFiniteSanitizer {
  // Keep existing generic method for backward compatibility
  static func sanitize(_ value: Any) -> Any {
    switch value {
    case let d as Double:
      if d.isFinite { return d }
      return toSentinel(d)
    case let f as Float:
      let d = Double(f)
      if d.isFinite { return d }
      return toSentinel(d)
    case let dict as [AnyHashable: Any]:
      var out: [AnyHashable: Any] = [:]
      for (k, v) in dict { out[k] = sanitize(v) }
      return out
    case let arr as [Any]:
      return arr.map { sanitize($0) }
    default:
      return value
    }
  }
  
  /// Type-safe method specifically for event data dictionaries.
  /// Sanitizes event data while preserving type safety.
  static func sanitizeEventData(_ eventData: [String: Any]) -> [String: Any] {
    var sanitized: [String: Any] = [:]
    for (key, value) in eventData {
      sanitized[key] = sanitize(value)
    }
    return sanitized
  }
  
  /// Generic method for sanitizing dictionaries with type preservation
  static func sanitizeDictionary<Key: Hashable, Value>(_ dict: [Key: Value]) -> [Key: Any] {
    var result: [Key: Any] = [:]
    for (key, value) in dict {
      result[key] = sanitize(value)
    }
    return result
  }
  
  // Helper to convert non-finite doubles to sentinel strings
  private static func toSentinel(_ d: Double) -> String {
    switch d {
    case .infinity:
      return "Infinity"
    case -.infinity:
      return "-Infinity"
    default:
      return "NaN"
    }
  }
}
