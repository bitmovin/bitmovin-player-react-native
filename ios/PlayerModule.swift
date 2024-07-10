// swiftlint:disable file_length
import BitmovinPlayer

@objc(PlayerModule)
public class PlayerModule: NSObject, RCTBridgeModule { // swiftlint:disable:this type_body_length
    // swiftlint:disable:next implicitly_unwrapped_optional
    @objc public var bridge: RCTBridge!

    /// In-memory mapping from `nativeId`s to `Player` instances.
    private var players: Registry<Player> = [:]

    // swiftlint:disable:next implicitly_unwrapped_optional
    public static func moduleName() -> String! {
        "PlayerModule"
    }

    public static func requiresMainQueueSetup() -> Bool {
        true
    }

    // swiftlint:disable:next implicitly_unwrapped_optional
    public var methodQueue: DispatchQueue! {
        bridge.uiManager.methodQueue
    }

    deinit {
        // Destroy all players on the main thread when the module is deallocated.
        // This is necessary when the IMA SDK is present in the app, as it may crash if the players are destroyed on a
        // background thread.
        DispatchQueue.main.async { [players] in
            players.values.forEach { $0.destroy() }
        }
    }

    /**
     Fetches the `Player` instance associated with `nativeId` from the internal players.
     - Parameter nativeId: `Player` instance ID.
     - Returns: The associated `Player` instance or `nil`.
     */
    @objc
    func retrieve(_ nativeId: NativeId) -> Player? {
        players[nativeId]
    }

    /**
     Creates a new `Player` instance inside the internal players using the provided `config` object.
     - Parameter config: `PlayerConfig` object received from JS.
     */
    @objc(initWithConfig:config:networkNativeId:)
    func initWithConfig(
        _ nativeId: NativeId,
        config: Any?,
        networkNativeId: NativeId?
    ) {
        bridge.uiManager.addUIBlock { [weak self] _, _ in
            guard
                self?.players[nativeId] == nil,
                let playerConfig = RCTConvert.playerConfig(config)
            else {
                return
            }
#if os(iOS)
            self?.setupRemoteControlConfig(playerConfig.remoteControlConfig)
#endif
            if let networkNativeId,
               let networkConfig = self?.setupNetworkConfig(nativeId: networkNativeId) {
                playerConfig.networkConfig = networkConfig
            }
            self?.players[nativeId] = PlayerFactory.create(playerConfig: playerConfig)
        }
    }

    /**
     Creates a new analytics enabled `Player` instance inside the internal players using the provided `config`
     and `analyticsConfig` object.
     - Parameter config: `PlayerConfig` object received from JS.
     - Parameter analyticsConfig: `AnalyticsConfig` object received from JS.
     */
    @objc(initWithAnalyticsConfig:config:networkNativeId:analyticsConfig:)
    func initWithAnalyticsConfig(
        _ nativeId: NativeId,
        config: Any?,
        networkNativeId: NativeId?,
        analyticsConfig: Any?
    ) {
        bridge.uiManager.addUIBlock { [weak self] _, _ in
            let analyticsConfigJson = analyticsConfig
            guard
                self?.players[nativeId] == nil,
                let playerConfig = RCTConvert.playerConfig(config),
                let analyticsConfig = RCTConvert.analyticsConfig(analyticsConfig)
            else {
                return
            }
#if os(iOS)
            self?.setupRemoteControlConfig(playerConfig.remoteControlConfig)
#endif
            if let networkNativeId,
               let networkConfig = self?.setupNetworkConfig(nativeId: networkNativeId) {
                playerConfig.networkConfig = networkConfig
            }
            let defaultMetadata = RCTConvert.analyticsDefaultMetadataFromAnalyticsConfig(analyticsConfigJson)
            self?.players[nativeId] = PlayerFactory.create(
                playerConfig: playerConfig,
                analyticsConfig: analyticsConfig,
                defaultMetadata: defaultMetadata ?? DefaultMetadata()
            )
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
                let source = self?.bridge[SourceModule.self]?.retrieve(sourceNativeId)
            else {
                return
            }
            player.load(source: source)
        }
    }

    /**
     Loads the given offline source configuration into `nativeId`'s `Player` object.
     - Parameter nativeId: Target player.
     - Parameter offlineContentManagerBridgeId: The `nativeId` of the `OfflineModule` object.
     */
    @objc(loadOfflineContent:offlineContentManagerBridgeId:options:)
    func loadOfflineContent(_ nativeId: NativeId, offlineContentManagerBridgeId: NativeId, options: Any?) {
#if os(iOS)
        bridge.uiManager.addUIBlock { [weak self] _, _ in
            guard let player = self?.players[nativeId],
                  let offlineContentManagerBridge = self?.bridge[OfflineModule.self]?
                .retrieve(offlineContentManagerBridgeId) else {
                return
            }
            let optionsDictionary = options as? [String: Any?] ?? [:]
            let restrictedToAssetCache = optionsDictionary["restrictedToAssetCache"] as? Bool ?? true
            let offlineSourceConfig = offlineContentManagerBridge
                .offlineContentManager
                .createOfflineSourceConfig(restrictedToAssetCache: restrictedToAssetCache)

            guard let offlineSourceConfig else { return }
            player.load(sourceConfig: offlineSourceConfig)
        }
#endif
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
     Sets `timeShift` on `nativeId`'s player.
     - Parameter nativeId: Target player Id.
     - Parameter offset: Offset to timeShift to in seconds.
     */
    @objc(timeShift:offset:)
    func timeShift(_ nativeId: NativeId, offset: NSNumber) {
        bridge.uiManager.addUIBlock { [weak self] _, _ in
            self?.players[nativeId]?.timeShift = offset.doubleValue
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
            if let mode {
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
     Resolve `nativeId`'s currently selected audio track.
     - Parameter nativeId: Target player Id.
     - Parameter resolver: JS promise resolver.
     - Parameter rejecter: JS promise rejecter.
     */
    @objc(getAudioTrack:resolver:rejecter:)
    func getAudioTrack(
        _ nativeId: NativeId,
        resolver resolve: @escaping RCTPromiseResolveBlock,
        rejecter reject: @escaping RCTPromiseRejectBlock
    ) {
        bridge.uiManager.addUIBlock { [weak self] _, _ in
            resolve(RCTConvert.audioTrackJson(self?.players[nativeId]?.audio))
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
            self?.players[nativeId]?.setAudio(trackIdentifier: trackIdentifier)
            resolve(nil)
        }
    }

    /**
     Resolve `nativeId`'s currently selected subtitle track.
     - Parameter nativeId: Target player Id.
     - Parameter resolver: JS promise resolver.
     - Parameter rejecter: JS promise rejecter.
     */
    @objc(getSubtitleTrack:resolver:rejecter:)
    func getSubtitleTrack(
        _ nativeId: NativeId,
        resolver resolve: @escaping RCTPromiseResolveBlock,
        rejecter reject: @escaping RCTPromiseRejectBlock
    ) {
        bridge.uiManager.addUIBlock { [weak self] _, _ in
            resolve(RCTConvert.subtitleTrackJson(self?.players[nativeId]?.subtitle))
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
        trackIdentifier: String?,
        resolver resolve: @escaping RCTPromiseResolveBlock,
        rejecter reject: @escaping RCTPromiseRejectBlock
    ) {
        bridge.uiManager.addUIBlock { [weak self] _, _ in
            if (trackIdentifier ?? "").isEmpty {
                self?.players[nativeId]?.setSubtitle(trackIdentifier: nil)
            } else {
                self?.players[nativeId]?.setSubtitle(trackIdentifier: trackIdentifier)
            }

            resolve(nil)
        }
    }

    /**
     Schedules an `AdItem` in the `nativeId`'s associated player.
     - Parameter nativeId: Target player id.
     - Parameter adItemJson: Json representation of the `AdItem` to be scheduled.
     */
    @objc(scheduleAd:adItemJson:)
    func scheduleAd(_ nativeId: NativeId, adItemJson: Any?) {
        guard let adItem = RCTConvert.adItem(adItemJson) else {
            return
        }
        bridge.uiManager.addUIBlock { [weak self] _, _ in
            self?.players[nativeId]?.scheduleAd(adItem: adItem)
        }
    }

    /**
     Skips the current ad in `nativeId`'s associated player.
     Has no effect if the current ad is not skippable or if no ad is being played back.
     - Parameter nativeId: Target player id.
     */
    @objc(skipAd:)
    func skipAd(_ nativeId: NativeId) {
        bridge.uiManager.addUIBlock { [weak self] _, _ in
            self?.players[nativeId]?.skipAd()
        }
    }

    /**
     Returns `true` while an ad is being played back or when main content playback has been paused for ad playback.
     - Parameter nativeId: Target player id.
     - Parameter resolver: JS promise resolver.
     - Parameter rejecter: JS promise rejecter.
     */
    @objc(isAd:resolver:rejecter:)
    func isAd(
        _ nativeId: NativeId,
        resolver resolve: @escaping RCTPromiseResolveBlock,
        rejecter reject: @escaping RCTPromiseRejectBlock
    ) {
        bridge.uiManager.addUIBlock { [weak self] _, _ in
            resolve(self?.players[nativeId]?.isAd)
        }
    }

    /**
     The current time shift of the live stream in seconds. This value is always 0 if the active `source` is not a
     live stream or there are no sources loaded.
     - Parameter nativeId: Target player id.
     - Parameter resolver: JS promise resolver.
     - Parameter rejecter: JS promise rejecter.
     */
    @objc(getTimeShift:resolver:rejecter:)
    func getTimeShift(
        _ nativeId: NativeId,
        resolver resolve: @escaping RCTPromiseResolveBlock,
        rejecter reject: @escaping RCTPromiseRejectBlock
    ) {
        bridge.uiManager.addUIBlock { [weak self] _, _ in
            resolve(self?.players[nativeId]?.timeShift)
        }
    }

    /**
     Returns the limit in seconds for time shift. Is either negative or 0. Is applicable for live streams only.
     - Parameter nativeId: Target player id.
     - Parameter resolver: JS promise resolver.
     - Parameter rejecter: JS promise rejecter.
     */
    @objc(getMaxTimeShift:resolver:rejecter:)
    func getMaxTimeShift(
        _ nativeId: NativeId,
        resolver resolve: @escaping RCTPromiseResolveBlock,
        rejecter reject: @escaping RCTPromiseRejectBlock
    ) {
        bridge.uiManager.addUIBlock { [weak self] _, _ in
            resolve(self?.players[nativeId]?.maxTimeShift)
        }
    }

    /**
     Sets the max selectable bitrate for the player.
     - Parameter nativeId: Target player id.
     - Parameter maxBitrate: The desired max bitrate limit.
     */
    @objc(setMaxSelectableBitrate:maxSelectableBitrate:)
    func setMaxSelectableBitrate(_ nativeId: NativeId, maxSelectableBitrate: NSNumber) {
        let maxSelectableBitrateValue = maxSelectableBitrate.intValue
        bridge.uiManager.addUIBlock { [weak self] _, _ in
            let maxSelectableBitrate = maxSelectableBitrateValue != -1 ? maxSelectableBitrateValue : 0
            self?.players[nativeId]?.maxSelectableBitrate = UInt(maxSelectableBitrate)
        }
    }

    /**
     Returns the thumbnail image for the active `Source` at a certain time.
     - Parameter nativeId: Target player id.
     - Parameter resolver: JS promise resolver.
     - Parameter rejecter: JS promise rejecter.
     */
    @objc(getThumbnail:time:resolver:rejecter:)
    func getThumbnail(
        _ nativeId: NativeId,
        time: NSNumber,
        resolver resolve: @escaping RCTPromiseResolveBlock,
        rejecter reject: @escaping RCTPromiseRejectBlock
    ) {
        bridge.uiManager.addUIBlock { [weak self] _, _ in
            resolve(RCTConvert.toJson(thumbnail: self?.players[nativeId]?.thumbnail(forTime: time.doubleValue)))
        }
    }

    /**
     Returns `true` if casting to another device (such as a ChromeCast) is available, otherwise false.
     - Parameter nativeId: Target player id.
     - Parameter resolver: JS promise resolver.
     - Parameter rejecter: JS promise rejecter.
     */
    @objc(isCastAvailable:resolver:rejecter:)
    func isCastAvailable(
        _ nativeId: NativeId,
        resolver resolve: @escaping RCTPromiseResolveBlock,
        rejecter reject: @escaping RCTPromiseRejectBlock
    ) {
        bridge.uiManager.addUIBlock { [weak self] _, _ in
            resolve(self?.players[nativeId]?.isCastAvailable)
        }
    }

    /**
     Returns `true` if the video is currently casted to a device and not played locally,
     or `false` if the video is played locally.
     - Parameter nativeId: Target player id.
     - Parameter resolver: JS promise resolver.
     - Parameter rejecter: JS promise rejecter.
     */
    @objc(isCasting:resolver:rejecter:)
    func isCasting(
        _ nativeId: NativeId,
        resolver resolve: @escaping RCTPromiseResolveBlock,
        rejecter reject: @escaping RCTPromiseRejectBlock
    ) {
        bridge.uiManager.addUIBlock { [weak self] _, _ in
            resolve(self?.players[nativeId]?.isCasting)
        }
    }

    /**
     Initiates casting the current video to a cast-compatible device.
     The user has to choose to which device it should be sent.
     */
    @objc(castVideo:)
    func castVideo(_ nativeId: NativeId) {
        bridge.uiManager.addUIBlock { [weak self] _, _ in
            self?.players[nativeId]?.castVideo()
        }
    }

    /**
     Stops casting the current video if it is casting at the moment (i.e. `isCasting` returns `true`).
     Has no effect if `isCasting` returns `false`.
     */
    @objc(castStop:)
    func castStop(_ nativeId: NativeId) {
        bridge.uiManager.addUIBlock { [weak self] _, _ in
            self?.players[nativeId]?.castStop()
        }
    }

    private func setupRemoteControlConfig(_ remoteControlConfig: RemoteControlConfig) {
        remoteControlConfig.prepareSource = { [weak self] _, sourceConfig in
            guard let sourceModule = self?.bridge[SourceModule.self],
                  let sourceNativeId = sourceModule.nativeId(where: { $0.sourceConfig === sourceConfig }),
                  let castSourceConfig = sourceModule.retrieveCastSourceConfig(sourceNativeId) else {
                return nil
            }

            return castSourceConfig
        }
    }

    private func setupNetworkConfig(nativeId: NativeId) -> NetworkConfig? {
        guard let networkModule = bridge[NetworkModule.self],
              let networkConfig = networkModule.retrieve(nativeId) else {
            return nil
        }
        return networkConfig
    }

    /**
     Resolve `nativeId`'s current video quality.
     - Parameter nativeId: Target player Id.
     - Parameter resolver: JS promise resolver.
     - Parameter rejecter: JS promise rejecter.
     */
    @objc(getVideoQuality:resolver:rejecter:)
    func getVideoQuality(
        _ nativeId: NativeId,
        resolver resolve: @escaping RCTPromiseResolveBlock,
        rejecter reject: @escaping RCTPromiseRejectBlock
    ) {
        bridge.uiManager.addUIBlock { [weak self] _, _ in
            resolve(RCTConvert.toJson(videoQuality: self?.players[nativeId]?.videoQuality))
        }
    }

    /**
     Resolve `nativeId`'s current available video qualities.
     - Parameter nativeId: Target player Id.
     - Parameter resolver: JS promise resolver.
     - Parameter rejecter: JS promise rejecter.
     */
    @objc(getAvailableVideoQualities:resolver:rejecter:)
    func getAvailableVideoQualities(
        _ nativeId: NativeId,
        resolver resolve: @escaping RCTPromiseResolveBlock,
        rejecter reject: @escaping RCTPromiseRejectBlock
    ) {
        bridge.uiManager.addUIBlock { [weak self] _, _ in
            let videoQualitiesJson = self?.players[nativeId]?.availableVideoQualities.map {
                RCTConvert.toJson(videoQuality: $0)
            }
            resolve(videoQualitiesJson ?? [])
        }
    }

    /**
     Resolve `nativeId`'s current playback speed.
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
     Sets playback speed for the player.
     - Parameter nativeId: Target player Id.
     - Parameter playbackSpeed: Float representing the playback speed level.
     */
    @objc(setPlaybackSpeed:playbackSpeed:)
    func setPlaybackSpeed(_ nativeId: NativeId, playbackSpeed: NSNumber) {
        bridge.uiManager.addUIBlock { [weak self] _, _ in
            self?.players[nativeId]?.playbackSpeed = playbackSpeed.floatValue
        }
    }

    /**
     Resolve `nativeId`'s possibility to play the media at specified playback speed.
     - Parameters:
       - nativeId: Target player Id.
       - playbackSpeed: The playback speed to check.
       - resolver: JS promise resolver.
       - rejecter: JS promise rejecter.
     */
    @objc(canPlayAtPlaybackSpeed:atPlaybackSpeed:resolver:rejecter:)
    func canPlayAtPlaybackSpeed(
        _ nativeId: NativeId,
        atPlaybackSpeed playbackSpeed: NSNumber,
        resolver resolve: @escaping RCTPromiseResolveBlock,
        rejecter reject: @escaping RCTPromiseRejectBlock
    ) {
        bridge.uiManager.addUIBlock { [weak self] _, _ in
            resolve(self?.players[nativeId]?.canPlay(atPlaybackSpeed: playbackSpeed.floatValue))
        }
    }
}
