import BitmovinPlayer

@objc(PlayerModule)
class PlayerModule: NSObject, RCTBridgeModule {
    /// React bridge reference.
    @objc var bridge: RCTBridge!

    /// In-memory mapping from `nativeId`s to `Player` instances.
    private var players: Registry<Player> = [:]

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
     Fetches the `Player` instance associated with `nativeId` from the internal players.
     - Parameter nativeId: `Player` instance ID.
     - Returns: The associated `Player` instance or `nil`.
     */
    @objc func retrieve(_ nativeId: NativeId) -> Player? {
        players[nativeId]
    }

    /**
     Creates a new `Player` instance inside the internal players using the provided `config` object.
     - Parameter config: `PlayerConfig` object received from JS.
     */
    @objc(initWithConfig:config:)
    func initWithConfig(_ nativeId: NativeId, config: Any?) {
        bridge.uiManager.addUIBlock { [weak self] _, _ in
            guard
                self?.players[nativeId] == nil,
                let playerConfig = RCTConvert.playerConfig(config)
            else {
                return
            }
            self?.players[nativeId] = PlayerFactory.create(playerConfig: playerConfig)
        }
    }

    /**
     Loads the given source configuration into `nativeId`'s `Player` object.
     - Parameter nativeId: Target player.
     - Parameter sourceNativeId: The `nativeId` of the `Source` object.
     */
    @objc(loadSource:sourceNativeId:)
    func loadSource(_ nativeId: NativeId, sourceNativeId: NativeId) {
        bridge.uiManager.addUIBlock { [weak self] _, _ in
            guard
                let player = self?.players[nativeId],
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
    func unload(_ nativeId: NativeId) {
        bridge.uiManager.addUIBlock { [weak self] _, _ in
            self?.players[nativeId]?.unload()
        }
    }

    /**
     Call `.play()` on `nativeId`'s player.
     - Parameter nativeId: Target player Id.
     */
    @objc(play:)
    func play(_ nativeId: NativeId) {
        bridge.uiManager.addUIBlock { [weak self] _, _ in
            self?.players[nativeId]?.play()
        }
    }

    /**
     Call `.pause()` on `nativeId`'s player.
     - Parameter nativeId: Target player Id.
     */
    @objc(pause:)
    func pause(_ nativeId: NativeId) {
        bridge.uiManager.addUIBlock { [weak self] _, _ in
            self?.players[nativeId]?.pause()
        }
    }

    /**
     Call `.seek(time:)` on `nativeId`'s player.
     - Parameter nativeId: Target player Id.
     - Parameter time: Time to seek in seconds.
     */
    @objc(seek:time:)
    func seek(_ nativeId: NativeId, time: NSNumber) {
        bridge.uiManager.addUIBlock { [weak self] _, _ in
            self?.players[nativeId]?.seek(time: time.doubleValue)
        }
    }

    /**
     Call `.mute()` on `nativeId`'s player.
     - Parameter nativeId: Target player Id.
     */
    @objc(mute:)
    func mute(_ nativeId: NativeId) {
        bridge.uiManager.addUIBlock { [weak self] _, _ in
            self?.players[nativeId]?.mute()
        }
    }

    /**
     Call `.unmute()` on `nativeId`'s player.
     - Parameter nativeId: Target player Id.
     */
    @objc(unmute:)
    func unmute(_ nativeId: NativeId) {
        bridge.uiManager.addUIBlock { [weak self] _, _ in
            self?.players[nativeId]?.unmute()
        }
    }

    /**
     Call `.destroy()` on `nativeId`'s player.
     - Parameter nativeId: Target player Id.
     */
    @objc(destroy:)
    func destroy(_ nativeId: NativeId) {
        bridge.uiManager.addUIBlock { [weak self] _, _ in
            if let player = self?.players[nativeId] {
                player.destroy()
                // Remove destroyed player from the players
                self?.players[nativeId] = nil
            }
        }
    }

    /**
     Call `.setVolume(volume:)` on `nativeId`'s player.
     - Parameter nativeId: Target player Id.
     - Parameter volume: Integer representing the volume level (between 0 to 100).
     */
    @objc(setVolume:volume:)
    func setVolume(_ nativeId: NativeId, volume: NSNumber) {
        bridge.uiManager.addUIBlock { [weak self] _, _ in
            self?.players[nativeId]?.volume = volume.intValue
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
        _ nativeId: NativeId,
        resolver resolve: @escaping RCTPromiseResolveBlock,
        rejecter reject: @escaping RCTPromiseRejectBlock
    ) {
        bridge.uiManager.addUIBlock { [weak self] _, _ in
            resolve(self?.players[nativeId]?.volume)
        }
    }

    /**
     Call `.setPlaybackSpeed(speed:)` on `nativeId`'s player.
     - Slow motion is used by values between 0 and 1, fast forward by values greater than 2, slow reverse is used by values between 0 and -1, and fast reverse is used by values less than -1.
     - Negative values are ignored during Casting.
     - During reverse playback the playback will continue until the beginning of the active source is reached. When reaching the beginning of the source, playback will be paused and the playback speed will be reset to its default value of 1. No PlaybackFinishedEvent will be emitted in this case.
     - Parameter nativeId: Target player Id.
     - Parameter volume: Set the playback speed of the player. Fast forward, slow motion and reverse playback are supported.
     */
    @objc(setPlaybackSpeed:speed:)
    func setPlaybackSpeed(_ nativeId: NativeId, speed: Float) {
        bridge.uiManager.addUIBlock { [weak self] _, _ in
            self?.players[nativeId]?.playbackSpeed = speed
        }
    }

    /**
     Resolve `nativeId`'s current playbackSpeed.
     - Parameter nativeId: Target player Id.
     - Parameter resolver: JS promise resolver.
     - Parameter rejecter: JS promise rejecter.
     */
    @objc(getPlaybackSpeed:resolver:rejecter:)
    func getPlaybackSpeed(
        _ nativeId: NativeId,
        resolver resolve: @escaping RCTPromiseResolveBlock,
        rejecter reject: @escaping RCTPromiseRejectBlock
    ) {
        bridge.uiManager.addUIBlock { [weak self] _, _ in
            resolve(self?.players[nativeId]?.playbackSpeed)
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
        _ nativeId: NativeId,
        mode: String?,
        resolver resolve: @escaping RCTPromiseResolveBlock,
        rejecter reject: @escaping RCTPromiseRejectBlock
    ) {
        bridge.uiManager.addUIBlock { [weak self] _, _ in
            let player = self?.players[nativeId]
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
        _ nativeId: NativeId,
        resolver resolve: @escaping RCTPromiseResolveBlock,
        rejecter reject: @escaping RCTPromiseRejectBlock
    ) {
        bridge.uiManager.addUIBlock { [weak self] _, _ in
            resolve(self?.players[nativeId]?.duration)
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
        _ nativeId: NativeId,
        resolver resolve: @escaping RCTPromiseResolveBlock,
        rejecter reject: @escaping RCTPromiseRejectBlock
    ) {
        bridge.uiManager.addUIBlock { [weak self] _, _ in
            resolve(self?.players[nativeId]?.isMuted)
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
        _ nativeId: NativeId,
        resolver resolve: @escaping RCTPromiseResolveBlock,
        rejecter reject: @escaping RCTPromiseRejectBlock
    ) {
        bridge.uiManager.addUIBlock { [weak self] _, _ in
            resolve(self?.players[nativeId]?.isPlaying)
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
        _ nativeId: NativeId,
        resolver resolve: @escaping RCTPromiseResolveBlock,
        rejecter reject: @escaping RCTPromiseRejectBlock
    ) {
        bridge.uiManager.addUIBlock { [weak self] _, _ in
            resolve(self?.players[nativeId]?.isPaused)
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
        _ nativeId: NativeId,
        resolver resolve: @escaping RCTPromiseResolveBlock,
        rejecter reject: @escaping RCTPromiseRejectBlock
    ) {
        bridge.uiManager.addUIBlock { [weak self] _, _ in
            resolve(self?.players[nativeId]?.isLive)
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
        _ nativeId: NativeId,
        resolver resolve: @escaping RCTPromiseResolveBlock,
        rejecter reject: @escaping RCTPromiseRejectBlock
    ) {
        bridge.uiManager.addUIBlock { [weak self] _, _ in
            resolve(self?.players[nativeId]?.isAirPlayActive)
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
        _ nativeId: NativeId,
        resolver resolve: @escaping RCTPromiseResolveBlock,
        rejecter reject: @escaping RCTPromiseRejectBlock
    ) {
        bridge.uiManager.addUIBlock { [weak self] _, _ in
            resolve(self?.players[nativeId]?.isAirPlayAvailable)
        }
    }

    /**
     Resolve `nativeId`'s player available audio tracks.
     - Parameter nativeId: Target player Id.
     - Parameter resolver: JS promise resolver.
     - Parameter rejecter: JS promise rejecter.
     */
    @objc(getAvailableAudioTracks:resolver:rejecter:)
    func getAvailableAudioTracks(
        _ nativeId: NativeId,
        resolver resolve: @escaping RCTPromiseResolveBlock,
        rejecter reject: @escaping RCTPromiseRejectBlock
    ) {
        bridge.uiManager.addUIBlock { [weak self] _, _ in
            let audioTracksJson = self?.players[nativeId]?.availableAudio.map {
                RCTConvert.audioTrackJson($0)
            }
            resolve(audioTracksJson ?? [])
        }
    }

    /**
     Set `nativeId`'s player audio track.
     - Parameter nativeId: Target player Id.
     - Parameter trackIdentifier: The audio track identifier.
     - Parameter resolver: JS promise resolver.
     - Parameter rejecter: JS promise rejecter.
     */
    @objc(setAudioTrack:trackIdentifier:resolver:rejecter:)
    func setAudioTrack(
        _ nativeId: NativeId,
        trackIdentifier: String,
        resolver resolve: @escaping RCTPromiseResolveBlock,
        rejecter reject: @escaping RCTPromiseRejectBlock
    ) {
        bridge.uiManager.addUIBlock { [weak self] _, _ in
            self?.players[nativeId]?.setAudio(trackIdentifier:trackIdentifier)
            resolve(nil)
        }
    }

    /**
     Resolve `nativeId`'s player available subtitle tracks.
     - Parameter nativeId: Target player Id.
     - Parameter resolver: JS promise resolver.
     - Parameter rejecter: JS promise rejecter.
     */
    @objc(getAvailableSubtitles:resolver:rejecter:)
    func getAvailableSubtitles(
        _ nativeId: NativeId,
        resolver resolve: @escaping RCTPromiseResolveBlock,
        rejecter reject: @escaping RCTPromiseRejectBlock
    ) {
        bridge.uiManager.addUIBlock { [weak self] _, _ in
            let subtitlesJson = self?.players[nativeId]?.availableSubtitles.map {
                RCTConvert.subtitleTrackJson($0)
            }
            resolve(subtitlesJson ?? [])
        }
    }

    /**
     Set `nativeId`'s player subtitle track.
     - Parameter nativeId: Target player Id.
     - Parameter trackIdentifier: The subtitle track identifier.
     - Parameter resolver: JS promise resolver.
     - Parameter rejecter: JS promise rejecter.
     */
    @objc(setSubtitleTrack:trackIdentifier:resolver:rejecter:)
    func setSubtitleTrack(
        _ nativeId: NativeId,
        trackIdentifier: String,
        resolver resolve: @escaping RCTPromiseResolveBlock,
        rejecter reject: @escaping RCTPromiseRejectBlock
    ) {
        bridge.uiManager.addUIBlock { [weak self] _, _ in
            if ((trackIdentifier ?? "").isEmpty) {
                self?.players[nativeId]?.setSubtitle(trackIdentifier:nil)
            } else {
                self?.players[nativeId]?.setSubtitle(trackIdentifier:trackIdentifier)
            }

            resolve(nil)
        }
    }
}
