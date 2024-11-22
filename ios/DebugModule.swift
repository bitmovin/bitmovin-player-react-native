import BitmovinPlayer

@objc(DebugModule)
public class DebugModule: NSObject, RCTBridgeModule {
    // swiftlint:disable:next implicitly_unwrapped_optional
    @objc public var bridge: RCTBridge!

    // swiftlint:disable:next implicitly_unwrapped_optional
    public static func moduleName() -> String! {
        "DebugModule"
    }

    /// Module requires main thread initialization.
    public static func requiresMainQueueSetup() -> Bool {
        true
    }

    // swiftlint:disable:next implicitly_unwrapped_optional
    public var methodQueue: DispatchQueue! {
        bridge.uiManager.methodQueue
    }
}

extension DebugModule {
    /// Enable/disable verbose logging for the console logger.
    /// - Parameter enabled: Whether to set verbose logging as enabled or disabled.
    @objc(setLoggingEnabled:)
    func setLoggingEnabled(enabled: Bool) {
        bridge.uiManager.addUIBlock { [weak self] _, _ in
            DebugConfig.logging.logger?.level = enabled ? .verbose : .warning
        }
    }
}
