import BitmovinPlayer
import ExpoModulesCore

public class PlayerModule: Module {
    private var players: Registry<Player> = [:]

    // swiftlint:disable:next function_body_length
    public func definition() -> ModuleDefinition {
        Name("PlayerModule")
        OnCreate {}
        OnDestroy {
            // Destroy all players on the main thread when the module is deallocated.
            // This is necessary when the IMA SDK is present in the app,
            // as it may crash if the players are destroyed on a background thread.
            DispatchQueue.main.async { [players] in
                players.values.forEach { $0.destroy() }
            }
        }
        AsyncFunction("play") { [weak self] (nativeId: String) in
            self?.players[nativeId]?.play()
        }.runOnQueue(.main)
        AsyncFunction("pause") { [weak self] (nativeId: String) in
            self?.players[nativeId]?.pause()
        }.runOnQueue(.main)
        AsyncFunction("mute") { [weak self] (nativeId: String) in
            self?.players[nativeId]?.mute()
        }.runOnQueue(.main)
        AsyncFunction("unmute") { [weak self] (nativeId: String) in
            self?.players[nativeId]?.unmute()
        }.runOnQueue(.main)
        AsyncFunction("seek") { [weak self] (nativeId: String, time: Double) in
            self?.players[nativeId]?.seek(time: time)
        }.runOnQueue(.main)
        AsyncFunction("timeShift") { [weak self] (nativeId: String, offset: Double) in
            self?.players[nativeId]?.timeShift = offset
        }.runOnQueue(.main)
        AsyncFunction("destroy") { [weak self] (nativeId: String) in
            if let player = self?.players[nativeId] {
                player.destroy()
                self?.players[nativeId] = nil
            }
        }.runOnQueue(.main)
        AsyncFunction("setVolume") { [weak self] (nativeId: String, volume: Int) in
            self?.players[nativeId]?.volume = volume
        }.runOnQueue(.main)
        AsyncFunction("unload") { [weak self] (nativeId: String) in
            self?.players[nativeId]?.unload()
        }.runOnQueue(.main)
        AsyncFunction("setPlaybackSpeed") { [weak self] (nativeId: String, playbackSpeed: Float) in
            self?.players[nativeId]?.playbackSpeed = playbackSpeed
        }.runOnQueue(.main)
        AsyncFunction("setMaxSelectableBitrate") { [weak self] (nativeId: String, maxBitrate: Int) in
            self?.players[nativeId]?.maxSelectableBitrate = UInt(maxBitrate)
        }.runOnQueue(.main)
        AsyncFunction("getVolume") { [weak self] (nativeId: String) -> Int? in
            self?.players[nativeId]?.volume
        }.runOnQueue(.main)
        AsyncFunction("currentTime") { [weak self] (nativeId: String, mode: String?) -> Double? in
            let player = self?.players[nativeId]
            if let mode {
                return player?.currentTime(RCTConvert.timeMode(mode))
            }
            return player?.currentTime
        }.runOnQueue(.main)
        AsyncFunction("isPlaying") { [weak self] (nativeId: String) -> Bool? in
            self?.players[nativeId]?.isPlaying
        }.runOnQueue(.main)
        AsyncFunction("isPaused") { [weak self] (nativeId: String) -> Bool? in
            self?.players[nativeId]?.isPaused
        }.runOnQueue(.main)
        AsyncFunction("duration") { [weak self] (nativeId: String) -> Double? in
            self?.players[nativeId]?.duration
        }.runOnQueue(.main)
        AsyncFunction("isMuted") { [weak self] (nativeId: String) -> Bool? in
            self?.players[nativeId]?.isMuted
        }.runOnQueue(.main)
        AsyncFunction("getTimeShift") { [weak self] (nativeId: String) -> Double? in
            self?.players[nativeId]?.timeShift
        }.runOnQueue(.main)
        AsyncFunction("isLive") { [weak self] (nativeId: String) -> Bool? in
            self?.players[nativeId]?.isLive
        }.runOnQueue(.main)
        AsyncFunction("getMaxTimeShift") { [weak self] (nativeId: String) -> Double? in
            self?.players[nativeId]?.maxTimeShift
        }.runOnQueue(.main)
        AsyncFunction("getPlaybackSpeed") { [weak self] (nativeId: String) -> Float? in
            self?.players[nativeId]?.playbackSpeed
        }.runOnQueue(.main)
        AsyncFunction("isAd") { [weak self] (nativeId: String) -> Bool? in
            self?.players[nativeId]?.isAd
        }.runOnQueue(.main)
        AsyncFunction("canPlayAtPlaybackSpeed") { [weak self] (nativeId: String, playbackSpeed: Float) -> Bool? in
            self?.players[nativeId]?.canPlay(atPlaybackSpeed: playbackSpeed)
        }.runOnQueue(.main)
        AsyncFunction("getAudioTrack") { [weak self] (nativeId: String) -> [String: Any]? in
            RCTConvert.audioTrackJson(self?.players[nativeId]?.audio)
        }.runOnQueue(.main)
        AsyncFunction("getAvailableAudioTracks") { [weak self] (nativeId: String) -> [[String: Any]] in
            self?.players[nativeId]?.availableAudio.compactMap { RCTConvert.audioTrackJson($0) } ?? []
        }.runOnQueue(.main)
        AsyncFunction("setAudioTrack") { [weak self] (nativeId: String, trackIdentifier: String) in
            self?.players[nativeId]?.setAudio(trackIdentifier: trackIdentifier)
        }.runOnQueue(.main)
        AsyncFunction("getSubtitleTrack") { [weak self] (nativeId: String) -> [String: Any]? in
            RCTConvert.subtitleTrackJson(self?.players[nativeId]?.subtitle)
        }.runOnQueue(.main)
        AsyncFunction("getAvailableSubtitles") { [weak self] (nativeId: String) -> [[String: Any]] in
            self?.players[nativeId]?.availableSubtitles.compactMap { RCTConvert.subtitleTrackJson($0) } ?? []
        }.runOnQueue(.main)
        AsyncFunction("setSubtitleTrack") { [weak self] (nativeId: String, trackIdentifier: String?) in
            self?.players[nativeId]?.setSubtitle(trackIdentifier: trackIdentifier)
        }.runOnQueue(.main)

        AsyncFunction("getVideoQuality") { [weak self] (nativeId: String) -> [String: Any]? in
            RCTConvert.toJson(videoQuality: self?.players[nativeId]?.videoQuality)
        }.runOnQueue(.main)
        AsyncFunction("getAvailableVideoQualities") { [weak self] (nativeId: String) -> [[String: Any]] in
            self?.players[nativeId]?.availableVideoQualities.compactMap { RCTConvert.toJson(videoQuality: $0) } ?? []
        }.runOnQueue(.main)
        AsyncFunction("getThumbnail") { [weak self] (nativeId: String, time: Double) -> [String: Any]? in
            RCTConvert.toJson(thumbnail: self?.players[nativeId]?.thumbnail(forTime: time))
        }.runOnQueue(.main)
        AsyncFunction("loadOfflineContent") { [weak self] (nativeId: String, bridgeId: String, options: [String: Any]?) in // swiftlint:disable:this line_length
            #if os(iOS)
            guard let player = self?.players[nativeId],
                  let offlineModule = self?.appContext?.moduleRegistry.get(OfflineModule.self),
                  let offlineContentManagerBridge = offlineModule.retrieve(bridgeId) else { return }
            let optionsDictionary = options ?? [:]
            let restrictedToAssetCache = optionsDictionary["restrictedToAssetCache"] as? Bool ?? true
            let offlineSourceConfig = offlineContentManagerBridge.offlineContentManager.createOfflineSourceConfig(
                restrictedToAssetCache: restrictedToAssetCache
            )
            guard let offlineSourceConfig else { return }
            player.load(sourceConfig: offlineSourceConfig)
            #endif
        }.runOnQueue(.main)
        AsyncFunction("scheduleAd") { [weak self] (nativeId: String, adItemJson: [String: Any]) in
            guard let adItem = RCTConvert.adItem(adItemJson) else { return }
            self?.players[nativeId]?.scheduleAd(adItem: adItem)
        }.runOnQueue(.main)
        AsyncFunction("isAirPlayActive") { [weak self] (nativeId: String) -> Bool? in
            #if os(iOS)
            return self?.players[nativeId]?.isAirPlayActive
            #else
            return nil
            #endif
        }.runOnQueue(.main)
        AsyncFunction("isAirPlayAvailable") { [weak self] (nativeId: String) -> Bool? in
            #if os(iOS)
            return self?.players[nativeId]?.allowsAirPlay
            #else
            return nil
            #endif
        }.runOnQueue(.main)
        AsyncFunction("isCastAvailable") { [weak self] (nativeId: String) -> Bool? in
            self?.players[nativeId]?.isCastAvailable
        }.runOnQueue(.main)
        AsyncFunction("isCasting") { [weak self] (nativeId: String) -> Bool? in
            self?.players[nativeId]?.isCasting
        }.runOnQueue(.main)
        AsyncFunction("castVideo") { [weak self] (nativeId: String) in
            self?.players[nativeId]?.castVideo()
        }.runOnQueue(.main)
        AsyncFunction("castStop") { [weak self] (nativeId: String) in
            self?.players[nativeId]?.castStop()
        }.runOnQueue(.main)
        AsyncFunction("skipAd") { [weak self] (nativeId: String) in
            self?.players[nativeId]?.skipAd()
        }.runOnQueue(.main)
        AsyncFunction(
            "initializeWithConfig"
        ) { [weak self] (nativeId: String, config: [String: Any]?, networkNativeId: String?, _: String?) in // swiftlint:disable:this line_length
            guard self?.players[nativeId] == nil, let playerConfig = RCTConvert.playerConfig(config) else { return }
            #if os(iOS)
            self?.setupRemoteControlConfig(playerConfig.remoteControlConfig)
            #endif
            if let networkNativeId, let networkConfig = self?.setupNetworkConfig(nativeId: networkNativeId) {
                playerConfig.networkConfig = networkConfig
            }
            self?.players[nativeId] = PlayerFactory.create(playerConfig: playerConfig)
        }.runOnQueue(.main)
        AsyncFunction(
            "initializeWithAnalyticsConfig"
        ) { [weak self] (nativeId: String, analyticsConfig: [String: Any]?, config: [String: Any]?, networkNativeId: String?, _: String?) in // swiftlint:disable:this line_length
            guard self?.players[nativeId] == nil,
                  let playerConfig = RCTConvert.playerConfig(config),
                  let analyticsConfig = RCTConvert.analyticsConfig(analyticsConfig) else { return } // swiftlint:disable:this line_length
            #if os(iOS)
            self?.setupRemoteControlConfig(playerConfig.remoteControlConfig)
            #endif
            if let networkNativeId, let networkConfig = self?.setupNetworkConfig(nativeId: networkNativeId) {
                playerConfig.networkConfig = networkConfig
            }
            let defaultMetadata = RCTConvert.analyticsDefaultMetadataFromAnalyticsConfig(analyticsConfig)
            self?.players[nativeId] = PlayerFactory.create(
                playerConfig: playerConfig,
                analyticsConfig: analyticsConfig,
                defaultMetadata: defaultMetadata ?? DefaultMetadata()
            )
        }.runOnQueue(.main)
        AsyncFunction("loadSource") { [weak self] (nativeId: String, sourceNativeId: String) in
            guard let player = self?.players[nativeId],
                  let sourceModule = self?.appContext?.moduleRegistry.get(SourceModule.self), // swiftlint:disable:this line_length
                  let source = sourceModule.retrieve(sourceNativeId) else { return }
            player.load(source: source)
        }.runOnQueue(.main)
    }

    /// This needs to stay stable to maintain compatibility for cross-module access..
    @objc
    public func retrieve(_ nativeId: NativeId) -> Player? {
        players[nativeId]
    }

    private func setupRemoteControlConfig(_ remoteControlConfig: RemoteControlConfig) {
        remoteControlConfig.prepareSource = { [weak self] _, sourceConfig in
            guard let sourceModule = self?.appContext?.moduleRegistry.get(SourceModule.self), // swiftlint:disable:this line_length
                  let sourceNativeId = sourceModule.nativeId(where: { $0.sourceConfig === sourceConfig }),
                  let castSourceConfig = sourceModule.retrieveCastSourceConfig(sourceNativeId) else {
                return nil
            }

            return castSourceConfig
        }
    }

    private func setupNetworkConfig(nativeId: String) -> NetworkConfig? {
        guard let networkModule = self.appContext?.moduleRegistry.get(NetworkModule.self) else {
            return nil
        }
        return networkModule.retrieve(nativeId)
    }
}
