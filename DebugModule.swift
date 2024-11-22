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

    /**
     - Gets the `LogLevel` from the debug Log.
     - Parameter nativeId: Native Id of the the player instance.
     - Parameter resolver: JS promise resolver.
     - Parameter rejecter: JS promise rejecter.
     */
    @objc(getLevel:resolver:rejecter:)
    func getLevel(
        _ playerId: NativeId,
        resolver resolve: @escaping RCTPromiseResolveBlock,
        rejecter reject: @escaping RCTPromiseRejectBlock
    ) {
        bridge.uiManager.addUIBlock { [weak self] _, _ in
            guard let logger = DebugConfig.logging.logger else {
                reject("[DebugModule]", "Invalid logger for player with ID: (\(playerId))", nil)
                return
            }
            let level = logger.level
            resolve(RCTConvert.toJson(logLevel: level))
        }
    }

    /**
     * Sets the level for the debug log.
     - Parameter nativeId: Target player id.
     - Parameter level: The level of the log to set.
     */
    @objc(setLogLevel:level:)
    func enableDebugging(_ playerId: NativeId, level: LogLevel) {
        bridge.uiManager.addUIBlock { [weak self] _, _ in
            DebugConfig.logging.logger?.level = level
        }
    }
}
