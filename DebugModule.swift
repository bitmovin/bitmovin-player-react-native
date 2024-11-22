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
    // TODO: docs
    @objc(setLoggingEnabled:)
    func setLoggingEnabled(enabled: Bool) {
        bridge.uiManager.addUIBlock { [weak self] _, _ in
            if enabled {
                DebugConfig.logging.logger?.level = .warning// TODO: .verbose
            }
            //        else {// TODO: else necessary??
            //            DebugConfig.logging.logger?.level
            //        }
        }
    }
}
