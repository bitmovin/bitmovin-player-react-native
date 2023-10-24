import BitmovinPlayer

@objc(BufferModule)
public class BufferModule: NSObject, RCTBridgeModule {
    // swiftlint:disable:next implicitly_unwrapped_optional
    @objc public var bridge: RCTBridge!

    /// PlayerModule instance fetched from the bridge's registry
    @objc var playerModule: PlayerModule? {
        bridge.module(for: PlayerModule.self) as? PlayerModule
    }

    // swiftlint:disable:next implicitly_unwrapped_optional
    public static func moduleName() -> String! {
        "BufferModule"
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
     - Gets the `BufferLevel` from the Player
     - Parameter nativeId: Native Id of the the player instance.
     - Parameter type: The type of buffer to return the level for.
     - Parameter resolver: JS promise resolver.
     - Parameter rejecter: JS promise rejecter.
     */
    @objc(getLevel:type:resolver:rejecter:)
    func getLevel(
        _ playerId: NativeId,
        type: String,
        resolver resolve: @escaping RCTPromiseResolveBlock,
        rejecter reject: @escaping RCTPromiseRejectBlock
    ) {
        bridge.uiManager.addUIBlock { [weak self] _, _ in
            guard let bufferApi = self?.playerModule?.retrieve(playerId)?.buffer else {
                reject("[BufferModule]", "Could not find player with ID (\(playerId))", nil)
                return
            }
            guard let bufferType = RCTConvert.bufferType(type) else {
                reject("[BufferModule]", "Invalid buffer type: (\(type))", nil)
                return
            }
            let level = bufferApi.getLevel(bufferType)
            let bufferLevels = RNBufferLevels(audio: level, video: level)
            resolve(RCTConvert.toJson(bufferLevels: bufferLevels))
        }
    }

    /**
     * Sets the target level in seconds for the forward buffer.
     - Parameter nativeId: Target player id.
     - Parameter type: The type of the buffer to set the target level for.
     - Parameter value: The value to set.
     */
    @objc(setTargetLevel:type:value:)
    func setTargetLevel(_ playerId: NativeId, type: String, value: NSNumber) {
        let targetLevel = value.doubleValue
        bridge.uiManager.addUIBlock { [weak self] _, _ in
            let bufferType = RCTConvert.bufferType(type)
            guard
                bufferType == .forwardDuration,
                let bufferApi = self?.playerModule?.retrieve(playerId)?.buffer
            else {
                return
            }

            bufferApi.setTargetLevel(targetLevel)
        }
    }
}
