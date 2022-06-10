private func rctLog(_ level: RCTLogLevel, _ message: String) {
  if RCT_DEV == 1 {
    RCTDefaultLogFunction(level, .native, nil, nil, message)
  }
}

public struct Logging {
  public static func info(_ message: String) {
    rctLog(.info, message)
  }
  public static func warn(_ message: String) {
    rctLog(.warning, message)
  }
  public static func error(_ message: String) {
    rctLog(.error, message)
  }
  public static func fatal(_ message: String) {
    rctLog(.fatal, message)
  }
  public static func trace(_ message: String) {
    rctLog(.trace, message)
  }
}
