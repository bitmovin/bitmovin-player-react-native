private func rctLog(_ level: RCTLogLevel, _ message: String) {
  if RCT_DEBUG != 0 {
    let log = RCTGetLogFunction()
    log?(level, .native, nil, nil, message)
    log?(level, .javaScript, nil, nil, message)
  }
}

public struct Log {
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
}
