import BitmovinPlayer

@objc(PlayerModule)
class PlayerModule: NSObject, RCTBridgeModule {
    /// React bridge reference.
    @objc var bridge: RCTBridge!

    /// Mapping between UUID values and `Player` objects.
    private var registry: [String: Player] = [:]

    /// JS module name.
    static func moduleName() -> String! {
        "PlayerModule"
    }

    /// Module requires main thread initialization.
    static func requiresMainQueueSetup() -> Bool {
        true
    }
    
    /// Since most `PlayerModule` operations are UI related and need to be executed on the main thread, they are scheduled with `UIManager.addBlock`.
    var methodQueue: DispatchQueue! {
        bridge.uiManager.methodQueue
    }

    /**
     Fetches the `Player` instance associated with `nativeId` from the internal registry.
     - Parameter nativeId: `Player` instance ID.
     - Returns: The associated `Player` instance or `nil`.
     */
    @objc func retrieve(_ nativeId: String) -> Player? {
        registry[nativeId]
    }

    /**
     Creates a new `Player` instance inside the internal registry using the provided `config` object.
     - Parameter config: `PlayerConfig` object received from JS.
     */
    @objc(initWithConfig:config:)
    func initWithConfig(_ nativeId: String, config: Any?) {
        bridge.uiManager.addUIBlock { [weak self] _, _ in
            guard
                self?.registry[nativeId] == nil,
                let playerConfig = RCTConvert.playerConfig(config)
            else {
                return
            }
            self?.registry[nativeId] = PlayerFactory.create(playerConfig: playerConfig)
        }
    }
    
    /**
     Loads the given source configuration into `nativeId`'s `Player` object.
     - Parameter nativeId: Target player.
     - Parameter sourceNativeId: The `nativeId` of the `Source` object.
     */
    @objc(loadSource:sourceNativeId:)
    func loadSource(_ nativeId: String, sourceNativeId: String) {
        bridge.uiManager.addUIBlock { [weak self] _, _ in
            guard
                let player = self?.registry[nativeId],
                let source = self?.getSourceModule()?.retrieve(sourceNativeId)
            else {
                return
            }
            player.load(source: source)
        }
    }

    /// Fetches the initialized `SourceModule` instance on RN's bridge object.
    private func getSourceModule() -> SourceModule? {
        bridge.module(for: SourceModule.self) as? SourceModule
    }

    /**
     Call `.unload()` on `nativeId`'s player.
     - Parameter nativeId: Target player Id.
     */
    @objc(unload:)
    func unload(_ nativeId: String) {
        bridge.uiManager.addUIBlock { [weak self] _, _ in
            self?.registry[nativeId]?.unload()
        }
    }

    /**
     Call `.play()` on `nativeId`'s player.
     - Parameter nativeId: Target player Id.
     */
    @objc(play:)
    func play(_ nativeId: String) {
        bridge.uiManager.addUIBlock { [weak self] _, _ in
            self?.registry[nativeId]?.play()
        }
    }

    /**
     Call `.pause()` on `nativeId`'s player.
     - Parameter nativeId: Target player Id.
     */
    @objc(pause:)
    func pause(_ nativeId: String) {
        bridge.uiManager.addUIBlock { [weak self] _, _ in
            self?.registry[nativeId]?.pause()
        }
    }

    /**
     Call `.seek(time:)` on `nativeId`'s player.
     - Parameter nativeId: Target player Id.
     - Parameter time: Time to seek in seconds.
     */
    @objc(seek:time:)
    func seek(_ nativeId: String, time: NSNumber) {
        bridge.uiManager.addUIBlock { [weak self] _, _ in
            self?.registry[nativeId]?.seek(time: time.doubleValue)
        }
    }

    /**
     Call `.mute()` on `nativeId`'s player.
     - Parameter nativeId: Target player Id.
     */
    @objc(mute:)
    func mute(_ nativeId: String) {
        bridge.uiManager.addUIBlock { [weak self] _, _ in
            self?.registry[nativeId]?.mute()
        }
    }

    /**
     Call `.unmute()` on `nativeId`'s player.
     - Parameter nativeId: Target player Id.
     */
    @objc(unmute:)
    func unmute(_ nativeId: String) {
        bridge.uiManager.addUIBlock { [weak self] _, _ in
            self?.registry[nativeId]?.unmute()
        }
    }

    /**
     Call `.destroy()` on `nativeId`'s player.
     - Parameter nativeId: Target player Id.
     */
    @objc(destroy:)
    func destroy(_ nativeId: String) {
        bridge.uiManager.addUIBlock { [weak self] _, _ in
            if let player = self?.registry[nativeId] {
                player.destroy()
                // Remove destroyed player from the registry
                self?.registry[nativeId] = nil
            }
        }
    }

    /**
     Call `.setVolume(volume:)` on `nativeId`'s player.
     - Parameter nativeId: Target player Id.
     - Parameter volume: Integer representing the volume level (between 0 to 100).
     */
    @objc(setVolume:volume:)
    func setVolume(_ nativeId: String, volume: NSNumber) {
        bridge.uiManager.addUIBlock { [weak self] _, _ in
            self?.registry[nativeId]?.volume = volume.intValue
        }
    }

    /**
     Resolve `nativeId`'s current volume.
     - Parameter nativeId: Target player Id.
     - Parameter resolver: JS promise resolver.
     - Parameter rejecter: JS promise rejecter.
     */
    @objc(getVolume:resolver:rejecter:)
    func getVolume(
        _ nativeId: String,
        resolver resolve: @escaping RCTPromiseResolveBlock,
        rejecter reject: @escaping RCTPromiseRejectBlock
    ) {
        bridge.uiManager.addUIBlock { [weak self] _, _ in
            resolve(self?.registry[nativeId]?.volume)
        }
    }

    /**
     Resolve `nativeId`'s current playback time.
     - Parameter nativeId: Target player Id.
     - Parameter mode: Time mode: either relative or absolute. Can be empty.
     - Parameter resolver: JS promise resolver.
     - Parameter rejecter: JS promise rejecter.
     */
    @objc(currentTime:mode:resolver:rejecter:)
    func currentTime(
        _ nativeId: String,
        mode: String?,
        resolver resolve: @escaping RCTPromiseResolveBlock,
        rejecter reject: @escaping RCTPromiseRejectBlock
    ) {
        bridge.uiManager.addUIBlock { [weak self] _, _ in
            let player = self?.registry[nativeId]
            if let mode = mode {
                resolve(player?.currentTime(RCTConvert.timeMode(mode)))
            } else {
                resolve(player?.currentTime)
            }
        }
    }

    /**
     Resolve `nativeId`'s active source duration.
     - Parameter nativeId: Target player Id.
     - Parameter resolver: JS promise resolver.
     - Parameter rejecter: JS promise rejecter.
     */
    @objc(duration:resolver:rejecter:)
    func duration(
        _ nativeId: String,
        resolver resolve: @escaping RCTPromiseResolveBlock,
        rejecter reject: @escaping RCTPromiseRejectBlock
    ) {
        bridge.uiManager.addUIBlock { [weak self] _, _ in
            resolve(self?.registry[nativeId]?.duration)
        }
    }

    /**
     Resolve `nativeId`'s current muted state.
     - Parameter nativeId: Target player Id.
     - Parameter resolver: JS promise resolver.
     - Parameter rejecter: JS promise rejecter.
     */
    @objc(isMuted:resolver:rejecter:)
    func isMuted(
        _ nativeId: String,
        resolver resolve: @escaping RCTPromiseResolveBlock,
        rejecter reject: @escaping RCTPromiseRejectBlock
    ) {
        bridge.uiManager.addUIBlock { [weak self] _, _ in
            resolve(self?.registry[nativeId]?.isMuted)
        }
    }

    /**
     Resolve `nativeId`'s current playing state.
     - Parameter nativeId: Target player Id.
     - Parameter resolver: JS promise resolver.
     - Parameter rejecter: JS promise rejecter.
     */
    @objc(isPlaying:resolver:rejecter:)
    func isPlaying(
        _ nativeId: String,
        resolver resolve: @escaping RCTPromiseResolveBlock,
        rejecter reject: @escaping RCTPromiseRejectBlock
    ) {
        bridge.uiManager.addUIBlock { [weak self] _, _ in
            resolve(self?.registry[nativeId]?.isPlaying)
        }
    }

    /**
     Resolve `nativeId`'s current paused state.
     - Parameter nativeId: Target player Id.
     - Parameter resolver: JS promise resolver.
     - Parameter rejecter: JS promise rejecter.
     */
    @objc(isPaused:resolver:rejecter:)
    func isPaused(
        _ nativeId: String,
        resolver resolve: @escaping RCTPromiseResolveBlock,
        rejecter reject: @escaping RCTPromiseRejectBlock
    ) {
        bridge.uiManager.addUIBlock { [weak self] _, _ in
            resolve(self?.registry[nativeId]?.isPaused)
        }
    }

    /**
     Resolve `nativeId`'s live streaming state.
     `true` if source is a live streaming.
     - Parameter nativeId: Target player Id.
     - Parameter resolver: JS promise resolver.
     - Parameter rejecter: JS promise rejecter.
     */
    @objc(isLive:resolver:rejecter:)
    func isLive(
        _ nativeId: String,
        resolver resolve: @escaping RCTPromiseResolveBlock,
        rejecter reject: @escaping RCTPromiseRejectBlock
    ) {
        bridge.uiManager.addUIBlock { [weak self] _, _ in
            resolve(self?.registry[nativeId]?.isLive)
        }
    }

    /**
     Resolve `nativeId`'s air play activation state.
     - Parameter nativeId: Target player Id.
     - Parameter resolver: JS promise resolver.
     - Parameter rejecter: JS promise rejecter.
     */
    @objc(isAirPlayActive:resolver:rejecter:)
    func isAirPlayActive(
        _ nativeId: String,
        resolver resolve: @escaping RCTPromiseResolveBlock,
        rejecter reject: @escaping RCTPromiseRejectBlock
    ) {
        bridge.uiManager.addUIBlock { [weak self] _, _ in
            resolve(self?.registry[nativeId]?.isAirPlayActive)
        }
    }

    /**
     Resolve `nativeId`'s air play availability state.
     - Parameter nativeId: Target player Id.
     - Parameter resolver: JS promise resolver.
     - Parameter rejecter: JS promise rejecter.
     */
    @objc(isAirPlayAvailable:resolver:rejecter:)
    func isAirPlayAvailable(
        _ nativeId: String,
        resolver resolve: @escaping RCTPromiseResolveBlock,
        rejecter reject: @escaping RCTPromiseRejectBlock
    ) {
        bridge.uiManager.addUIBlock { [weak self] _, _ in
            resolve(self?.registry[nativeId]?.isAirPlayAvailable)
        }
    }
}
