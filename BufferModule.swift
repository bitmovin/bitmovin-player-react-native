import BitmovinPlayer

@objc(BufferModule)
class BufferModule: NSObject, RCTBridgeModule {
    /**
     * Collection of `BufferLevel` objects
     * - Parameter audio: `BufferLevel` for `MediaType.Audio`.
     * - Parameter video: `BufferLevel` for `MediaType.Video`.
     */
    struct RNBufferLevels {
        let audio: BufferLevel
        let video: BufferLevel
    }

    /// React bridge reference.
    @objc var bridge: RCTBridge!

    /// PlayerModule instance fetched from the bridge's registry
    @objc var playerModule: PlayerModule? {
        bridge.module(for: PlayerModule.self) as? PlayerModule
    }

    /// JS module name.
    static func moduleName() -> String! {
        "BufferModule"
    }

    /// Module requires main thread initialization.
    static func requiresMainQueueSetup() -> Bool {
        true
    }

    /// Use `UIManager.addBlock` to enqueue module methods on UI thread.
    var methodQueue: DispatchQueue! {
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
        type: NSNumber,
        resolver resolve: @escaping RCTPromiseResolveBlock,
        rejecter reject: @escaping RCTPromiseRejectBlock
    ) {
        bridge.uiManager.addUIBlock { [weak self] _, _ in
            guard let bufferApi = self?.playerModule?.retrieve(playerId)?.buffer else {
                reject("[BufferModule]", "Could not find player with ID (\(playerId))", nil)
                return
            }
            guard let bufferType = RCTConvert.bufferType(type) else {
                reject("[BufferModule]", "Invalid buffer type", nil)
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
    func setTargetLevel(_ playerId: NativeId, type: NSNumber, value: TimeInterval) {
        bridge.uiManager.addUIBlock { [weak self] _, _ in
            guard
                let bufferApi = self?.playerModule?.retrieve(playerId)?.buffer,
                let bufferType = RCTConvert.bufferType(type),
                bufferType == .forwardDuration
            else {
                return
            }

            bufferApi.setTargetLevel(value)
        }
    }
}
