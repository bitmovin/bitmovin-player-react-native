import BitmovinPlayer

@objc(PlayerModule)
class PlayerModule: NSObject, RCTBridgeModule {
    /// Injected React bridge reference.
    @objc var bridge: RCTBridge!

    /// In-memory dictionary of id <-> `Player` mappings.
    private var registry: [String: Player] = [:]

    /// Name of JS exported module.
    static func moduleName() -> String! {
        "PlayerModule"
    }

    /// Initialize module on main thread.
    static func requiresMainQueueSetup() -> Bool {
        true
    }
    
    /// Since most `PlayerModule` operations are UI related and require to be executed on the main thread,
    /// they are scheduled by `UIManager`.
    var methodQueue: DispatchQueue! {
        bridge.uiManager.methodQueue
    }

    /**
     Resolve the current `Player` instance associated with the given `id`. Intented to
     be used by other RN bridge modules, such as `RNPlayerViewManager`.
     - Parameter id: Target player id.
     - Returns: The player instance found if there's any.
     */
    @objc func player(with id: String) -> Player? {
        registry[id]
    }

    /**
     Synchronously generate a random UUID for `Player`s `nativeId` when none is provided by the user.
     - Returns: Random UUID RFC 4122 version 4.
     */
    @objc func generateUUIDv4() -> String {
        UUID().uuidString
    }

    /**
     Create a new `Player` instance for the given `config` if none exists yet.
     - Parameter config: Player configuration options sent from JS.
     - Parameter playbackConfig: PlaybackConfig configuration options sent from JS.
     */
    @objc(initWithConfig:config:playbackConfiguration:)
    func initWithConfig(_ playerId: String, config: Any?, playbackConfiguration: Any?) {
        bridge.uiManager.addUIBlock { [weak self] _, _ in
            guard
                self?.registry[playerId] == nil,
                let playerConfig = RCTConvert.playerConfig(config),
                let playerPlaybackConfiguration = RCTConvert.playbackConfig(playbackConfiguration)
            else {
                return
            }
            self?.registry[playerId] = PlayerFactory.create(playerConfig: playerConfig)
            self?.registry[playerId]?.config.playbackConfig = playerPlaybackConfiguration
        }
    }

    /**
     Load the source of the given `playerId` with `config` options from JS.
     - Parameter playerId: Target player.
     - Parameter config: Source configuration options from JS.
     */
    @objc(loadSource:config:)
    func loadSource(_ playerId: String, config: Any) {
        bridge.uiManager.addUIBlock { [weak self] _, _ in
            guard
                let player = self?.registry[playerId],
                let sourceConfig = RCTConvert.sourceConfig(config)
            else {
                return
            }
            player.load(sourceConfig: sourceConfig)
        }
    }

    /**
     Call `.unload()` on `playerId`'s player.
     - Parameter playerId: Target player Id.
     */
    @objc(unload:)
    func unload(_ playerId: String) {
        bridge.uiManager.addUIBlock { [weak self] _, _ in
            self?.registry[playerId]?.unload()
        }
    }

    /**
     Call `.play()` on `playerId`'s player.
     - Parameter playerId: Target player Id.
     */
    @objc(play:)
    func play(_ playerId: String) {
        bridge.uiManager.addUIBlock { [weak self] _, _ in
            self?.registry[playerId]?.play()
        }
    }

    /**
     Call `.pause()` on `playerId`'s player.
     - Parameter playerId: Target player Id.
     */
    @objc(pause:)
    func pause(_ playerId: String) {
        bridge.uiManager.addUIBlock { [weak self] _, _ in
            self?.registry[playerId]?.pause()
        }
    }

    /**
     Call `.seek(time:)` on `playerId`'s player.
     - Parameter playerId: Target player Id.
     - Parameter time: Time to seek in seconds.
     */
    @objc(seek:time:)
    func seek(_ playerId: String, time: NSNumber) {
        bridge.uiManager.addUIBlock { [weak self] _, _ in
            self?.registry[playerId]?.seek(time: time.doubleValue)
        }
    }

    /**
     Call `.mute()` on `playerId`'s player.
     - Parameter playerId: Target player Id.
     */
    @objc(mute:)
    func mute(_ playerId: String) {
        bridge.uiManager.addUIBlock { [weak self] _, _ in
            self?.registry[playerId]?.mute()
        }
    }

    /**
     Call `.unmute()` on `playerId`'s player.
     - Parameter playerId: Target player Id.
     */
    @objc(unmute:)
    func unmute(_ playerId: String) {
        bridge.uiManager.addUIBlock { [weak self] _, _ in
            self?.registry[playerId]?.unmute()
        }
    }

    /**
     Call `.destroy()` on `playerId`'s player.
     - Parameter playerId: Target player Id.
     */
    @objc(destroy:)
    func destroy(_ playerId: String) {
        bridge.uiManager.addUIBlock { [weak self] _, _ in
            if let player = self?.registry[playerId] {
                player.destroy()
                // Remove destroyed player from the registry
                self?.registry[playerId] = nil
            }
        }
    }

    /**
     Call `.setVolume(volume:)` on `playerId`'s player.
     - Parameter playerId: Target player Id.
     - Parameter volume: Integer representing the volume level (between 0 to 100).
     */
    @objc(setVolume:volume:)
    func setVolume(_ playerId: String, volume: NSNumber) {
        bridge.uiManager.addUIBlock { [weak self] _, _ in
            self?.registry[playerId]?.volume = volume.intValue
        }
    }

    /**
     Resolve the source of `playerId`'s player.
     - Parameter playerId: Target player Id.
     - Parameter resolver: JS promise resolver.
     - Parameter rejecter: JS promise rejecter.
     */
    @objc(source:resolver:rejecter:)
    func source(
        _ playerId: String,
        resolver resolve: @escaping RCTPromiseResolveBlock,
        rejecter reject: @escaping RCTPromiseRejectBlock
    ) {
        bridge.uiManager.addUIBlock { [weak self] _, _ in
            resolve(self?.registry[playerId]?.source?.toJSON())
        }
    }

    /**
     Resolve `playerId`'s current volume.
     - Parameter playerId: Target player Id.
     - Parameter resolver: JS promise resolver.
     - Parameter rejecter: JS promise rejecter.
     */
    @objc(getVolume:resolver:rejecter:)
    func getVolume(
        _ playerId: String,
        resolver resolve: @escaping RCTPromiseResolveBlock,
        rejecter reject: @escaping RCTPromiseRejectBlock
    ) {
        bridge.uiManager.addUIBlock { [weak self] _, _ in
            resolve(self?.registry[playerId]?.volume)
        }
    }

    /**
     Resolve `playerId`'s current playback time.
     - Parameter playerId: Target player Id.
     - Parameter mode: Time mode: either relative or absolute. Can be empty.
     - Parameter resolver: JS promise resolver.
     - Parameter rejecter: JS promise rejecter.
     */
    @objc(currentTime:mode:resolver:rejecter:)
    func currentTime(
        _ playerId: String,
        mode: String?,
        resolver resolve: @escaping RCTPromiseResolveBlock,
        rejecter reject: @escaping RCTPromiseRejectBlock
    ) {
        bridge.uiManager.addUIBlock { [weak self] _, _ in
            let player = self?.registry[playerId]
            if let mode = mode {
                resolve(player?.currentTime(RCTConvert.timeMode(mode)))
            } else {
                resolve(player?.currentTime)
            }
        }
    }

    /**
     Resolve `playerId`'s active source duration.
     - Parameter playerId: Target player Id.
     - Parameter resolver: JS promise resolver.
     - Parameter rejecter: JS promise rejecter.
     */
    @objc(duration:resolver:rejecter:)
    func duration(
        _ playerId: String,
        resolver resolve: @escaping RCTPromiseResolveBlock,
        rejecter reject: @escaping RCTPromiseRejectBlock
    ) {
        bridge.uiManager.addUIBlock { [weak self] _, _ in
            resolve(self?.registry[playerId]?.duration)
        }
    }

    /**
     Resolve `playerId`'s current muted state.
     - Parameter playerId: Target player Id.
     - Parameter resolver: JS promise resolver.
     - Parameter rejecter: JS promise rejecter.
     */
    @objc(isMuted:resolver:rejecter:)
    func isMuted(
        _ playerId: String,
        resolver resolve: @escaping RCTPromiseResolveBlock,
        rejecter reject: @escaping RCTPromiseRejectBlock
    ) {
        bridge.uiManager.addUIBlock { [weak self] _, _ in
            resolve(self?.registry[playerId]?.isMuted)
        }
    }

    /**
     Resolve `playerId`'s current playing state.
     - Parameter playerId: Target player Id.
     - Parameter resolver: JS promise resolver.
     - Parameter rejecter: JS promise rejecter.
     */
    @objc(isPlaying:resolver:rejecter:)
    func isPlaying(
        _ playerId: String,
        resolver resolve: @escaping RCTPromiseResolveBlock,
        rejecter reject: @escaping RCTPromiseRejectBlock
    ) {
        bridge.uiManager.addUIBlock { [weak self] _, _ in
            resolve(self?.registry[playerId]?.isPlaying)
        }
    }

    /**
     Resolve `playerId`'s current paused state.
     - Parameter playerId: Target player Id.
     - Parameter resolver: JS promise resolver.
     - Parameter rejecter: JS promise rejecter.
     */
    @objc(isPaused:resolver:rejecter:)
    func isPaused(
        _ playerId: String,
        resolver resolve: @escaping RCTPromiseResolveBlock,
        rejecter reject: @escaping RCTPromiseRejectBlock
    ) {
        bridge.uiManager.addUIBlock { [weak self] _, _ in
            resolve(self?.registry[playerId]?.isPaused)
        }
    }

    /**
     Resolve `playerId`'s live streaming state.
     `true` if source is a live streaming.
     - Parameter playerId: Target player Id.
     - Parameter resolver: JS promise resolver.
     - Parameter rejecter: JS promise rejecter.
     */
    @objc(isLive:resolver:rejecter:)
    func isLive(
        _ playerId: String,
        resolver resolve: @escaping RCTPromiseResolveBlock,
        rejecter reject: @escaping RCTPromiseRejectBlock
    ) {
        bridge.uiManager.addUIBlock { [weak self] _, _ in
            resolve(self?.registry[playerId]?.isLive)
        }
    }

    /**
     Resolve `playerId`'s air play activation state.
     - Parameter playerId: Target player Id.
     - Parameter resolver: JS promise resolver.
     - Parameter rejecter: JS promise rejecter.
     */
    @objc(isAirPlayActive:resolver:rejecter:)
    func isAirPlayActive(
        _ playerId: String,
        resolver resolve: @escaping RCTPromiseResolveBlock,
        rejecter reject: @escaping RCTPromiseRejectBlock
    ) {
        bridge.uiManager.addUIBlock { [weak self] _, _ in
            resolve(self?.registry[playerId]?.isAirPlayActive)
        }
    }

    /**
     Resolve `playerId`'s air play availability state.
     - Parameter playerId: Target player Id.
     - Parameter resolver: JS promise resolver.
     - Parameter rejecter: JS promise rejecter.
     */
    @objc(isAirPlayAvailable:resolver:rejecter:)
    func isAirPlayAvailable(
        _ playerId: String,
        resolver resolve: @escaping RCTPromiseResolveBlock,
        rejecter reject: @escaping RCTPromiseRejectBlock
    ) {
        bridge.uiManager.addUIBlock { [weak self] _, _ in
            resolve(self?.registry[playerId]?.isAirPlayAvailable)
        }
    }
}
