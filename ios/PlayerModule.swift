import BitmovinPlayer
import ExpoModulesCore
#if canImport(GoogleInteractiveMediaAds) && os(iOS)
import UIKit
#endif

// swiftlint:disable:next type_body_length
public class PlayerModule: Module {
    private let imaSettingsWaiter = ResultWaiter<[String: Any]>()

    #if canImport(GoogleInteractiveMediaAds) && os(iOS)
    private var adsWrappers: [String: IMAAdsWrapper] = [:]
    #endif

    // swiftlint:disable:next function_body_length cyclomatic_complexity
    public func definition() -> ModuleDefinition {
        Name("PlayerModule")
        OnCreate {}
        OnDestroy { [weak self] in
            self?.imaSettingsWaiter.removeAll()
            // Destroy all players on the main thread when the module is deallocated.
            // This is necessary when the IMA SDK is present in the app,
            // as it may crash if the players are destroyed on a background thread.
            DispatchQueue.main.async { [weak self] in
                PlayerRegistry.getAllPlayers().forEach { $0.destroy() }
                PlayerRegistry.clear()
                #if canImport(GoogleInteractiveMediaAds) && os(iOS)
                self?.adsWrappers.removeAll()
                #endif
            }
        }
        Events("onImaBeforeInitialization")
        AsyncFunction("play") { (nativeId: NativeId) in
            PlayerRegistry.getPlayer(nativeId: nativeId)?.play()
        }.runOnQueue(.main)
        AsyncFunction("pause") { (nativeId: NativeId) in
            PlayerRegistry.getPlayer(nativeId: nativeId)?.pause()
        }.runOnQueue(.main)
        AsyncFunction("mute") { (nativeId: NativeId) in
            PlayerRegistry.getPlayer(nativeId: nativeId)?.mute()
        }.runOnQueue(.main)
        AsyncFunction("unmute") { (nativeId: NativeId) in
            PlayerRegistry.getPlayer(nativeId: nativeId)?.unmute()
        }.runOnQueue(.main)
        AsyncFunction("seek") { (nativeId: NativeId, time: Double) in
            PlayerRegistry.getPlayer(nativeId: nativeId)?.seek(time: time)
        }.runOnQueue(.main)
        AsyncFunction("timeShift") { (nativeId: NativeId, offset: Double) in
            PlayerRegistry.getPlayer(nativeId: nativeId)?.timeShift = offset
        }.runOnQueue(.main)
        AsyncFunction("destroy") { [weak self] (nativeId: NativeId) in
            if let player = PlayerRegistry.getPlayer(nativeId: nativeId) {
                player.destroy()
                PlayerRegistry.unregister(nativeId: nativeId)
            }
            #if canImport(GoogleInteractiveMediaAds) && os(iOS)
            self?.adsWrappers[nativeId] = nil
            #endif
        }.runOnQueue(.main)
        AsyncFunction("setVolume") { (nativeId: NativeId, volume: Int) in
            PlayerRegistry.getPlayer(nativeId: nativeId)?.volume = volume
        }.runOnQueue(.main)
        AsyncFunction("unload") { (nativeId: NativeId) in
            PlayerRegistry.getPlayer(nativeId: nativeId)?.unload()
        }.runOnQueue(.main)
        AsyncFunction("setPlaybackSpeed") { (nativeId: NativeId, playbackSpeed: Float) in
            PlayerRegistry.getPlayer(nativeId: nativeId)?.playbackSpeed = playbackSpeed
        }.runOnQueue(.main)
        AsyncFunction("setMaxSelectableBitrate") { (nativeId: NativeId, maxSelectableBitrate: Int) in
            PlayerRegistry.getPlayer(nativeId: nativeId)?.maxSelectableBitrate = UInt(maxSelectableBitrate)
        }.runOnQueue(.main)
        AsyncFunction("getVolume") { (nativeId: NativeId) -> Int? in
            PlayerRegistry.getPlayer(nativeId: nativeId)?.volume
        }.runOnQueue(.main)
        AsyncFunction("currentTime") { (nativeId: NativeId, mode: String?) -> Double? in
            let player = PlayerRegistry.getPlayer(nativeId: nativeId)
            if let mode {
                return player?.currentTime(RCTConvert.timeMode(mode))
            }
            return player?.currentTime
        }.runOnQueue(.main)
        AsyncFunction("isPlaying") { (nativeId: NativeId) -> Bool? in
            PlayerRegistry.getPlayer(nativeId: nativeId)?.isPlaying
        }.runOnQueue(.main)
        AsyncFunction("isPaused") { (nativeId: NativeId) -> Bool? in
            PlayerRegistry.getPlayer(nativeId: nativeId)?.isPaused
        }.runOnQueue(.main)
        AsyncFunction("duration") { (nativeId: NativeId) -> Double? in
            PlayerRegistry.getPlayer(nativeId: nativeId)?.duration
        }.runOnQueue(.main)
        AsyncFunction("isMuted") { (nativeId: NativeId) -> Bool? in
            PlayerRegistry.getPlayer(nativeId: nativeId)?.isMuted
        }.runOnQueue(.main)
        AsyncFunction("getTimeShift") { (nativeId: NativeId) -> Double? in
            PlayerRegistry.getPlayer(nativeId: nativeId)?.timeShift
        }.runOnQueue(.main)
        AsyncFunction("isLive") { (nativeId: NativeId) -> Bool? in
            PlayerRegistry.getPlayer(nativeId: nativeId)?.isLive
        }.runOnQueue(.main)
        AsyncFunction("getMaxTimeShift") { (nativeId: NativeId) -> Double? in
            PlayerRegistry.getPlayer(nativeId: nativeId)?.maxTimeShift
        }.runOnQueue(.main)
        AsyncFunction("getPlaybackSpeed") { (nativeId: NativeId) -> Float? in
            PlayerRegistry.getPlayer(nativeId: nativeId)?.playbackSpeed
        }.runOnQueue(.main)
        AsyncFunction("isAd") { (nativeId: NativeId) -> Bool? in
            PlayerRegistry.getPlayer(nativeId: nativeId)?.isAd
        }.runOnQueue(.main)
        AsyncFunction("canPlayAtPlaybackSpeed") { (nativeId: NativeId, playbackSpeed: Float) -> Bool? in
            PlayerRegistry.getPlayer(nativeId: nativeId)?.canPlay(atPlaybackSpeed: playbackSpeed)
        }.runOnQueue(.main)
        AsyncFunction("getAudioTrack") { (nativeId: NativeId) -> [String: Any]? in
            RCTConvert.audioTrackJson(PlayerRegistry.getPlayer(nativeId: nativeId)?.audio)
        }.runOnQueue(.main)
        AsyncFunction("getAvailableAudioTracks") { (nativeId: NativeId) -> [[String: Any]] in
            PlayerRegistry.getPlayer(nativeId: nativeId)?
                .availableAudio.compactMap { RCTConvert.audioTrackJson($0) } ?? []
        }.runOnQueue(.main)
        AsyncFunction("setAudioTrack") { (nativeId: NativeId, trackIdentifier: String) in
            PlayerRegistry.getPlayer(nativeId: nativeId)?.setAudio(trackIdentifier: trackIdentifier)
        }.runOnQueue(.main)
        AsyncFunction("getSubtitleTrack") { (nativeId: NativeId) -> [String: Any]? in
            RCTConvert.subtitleTrackJson(PlayerRegistry.getPlayer(nativeId: nativeId)?.subtitle)
        }.runOnQueue(.main)
        AsyncFunction("getAvailableSubtitles") { (nativeId: NativeId) -> [[String: Any]] in
            PlayerRegistry.getPlayer(nativeId: nativeId)?
                .availableSubtitles
                .compactMap { RCTConvert.subtitleTrackJson($0) } ?? []
        }.runOnQueue(.main)
        AsyncFunction("setSubtitleTrack") { (nativeId: NativeId, trackIdentifier: String?) in
            PlayerRegistry.getPlayer(nativeId: nativeId)?.setSubtitle(trackIdentifier: trackIdentifier)
        }.runOnQueue(.main)

        AsyncFunction("getVideoQuality") { (nativeId: NativeId) -> [String: Any]? in
            RCTConvert.toJson(videoQuality: PlayerRegistry.getPlayer(nativeId: nativeId)?.videoQuality)
        }.runOnQueue(.main)
        AsyncFunction("getAvailableVideoQualities") { (nativeId: NativeId) -> [[String: Any]] in
            PlayerRegistry.getPlayer(nativeId: nativeId)?
                .availableVideoQualities.compactMap { RCTConvert.toJson(videoQuality: $0) } ?? []
        }.runOnQueue(.main)
        AsyncFunction("getThumbnail") { (nativeId: NativeId, time: Double) -> [String: Any]? in
            RCTConvert.toJson(thumbnail: PlayerRegistry.getPlayer(nativeId: nativeId)?.thumbnail(forTime: time))
        }.runOnQueue(.main)
        AsyncFunction("loadOfflineContent") { [weak self] (nativeId: NativeId, bridgeId: String, options: [String: Any]?) in // swiftlint:disable:this line_length
            #if os(iOS)
            guard let player = PlayerRegistry.getPlayer(nativeId: nativeId),
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
        AsyncFunction("scheduleAd") { (nativeId: NativeId, adItemJson: [String: Any]) in
            guard let adItem = RCTConvert.adItem(adItemJson) else { return }
            PlayerRegistry.getPlayer(nativeId: nativeId)?.scheduleAd(adItem: adItem)
        }.runOnQueue(.main)
        AsyncFunction("isAirPlayActive") { (nativeId: NativeId) -> Bool? in
            #if os(iOS)
            PlayerRegistry.getPlayer(nativeId: nativeId)?.isAirPlayActive
            #else
            nil
            #endif
        }.runOnQueue(.main)
        AsyncFunction("isAirPlayAvailable") { (nativeId: NativeId) -> Bool? in
            #if os(iOS)
            PlayerRegistry.getPlayer(nativeId: nativeId)?.allowsAirPlay
            #else
            nil
            #endif
        }.runOnQueue(.main)
        AsyncFunction("isCastAvailable") { (nativeId: NativeId) -> Bool? in
            PlayerRegistry.getPlayer(nativeId: nativeId)?.isCastAvailable
        }.runOnQueue(.main)
        AsyncFunction("isCasting") { (nativeId: NativeId) -> Bool? in
            PlayerRegistry.getPlayer(nativeId: nativeId)?.isCasting
        }.runOnQueue(.main)
        AsyncFunction("castVideo") { (nativeId: NativeId) in
            PlayerRegistry.getPlayer(nativeId: nativeId)?.castVideo()
        }.runOnQueue(.main)
        AsyncFunction("castStop") { (nativeId: NativeId) in
            PlayerRegistry.getPlayer(nativeId: nativeId)?.castStop()
        }.runOnQueue(.main)
        AsyncFunction("skipAd") { (nativeId: NativeId) in
            PlayerRegistry.getPlayer(nativeId: nativeId)?.skipAd()
        }.runOnQueue(.main)
        AsyncFunction("setPreparedImaSettings") { [weak self] (id: Int, settings: [String: Any]?) in
            self?.imaSettingsWaiter.complete(id: id, with: settings ?? [:])
        }
        AsyncFunction(
            "initializeWithConfig"
        ) { [weak self] (nativeId: NativeId, config: [String: Any]?, networkNativeId: NativeId?, _: String?) in // swiftlint:disable:this line_length
            guard !PlayerRegistry.hasPlayer(nativeId: nativeId),
                  let playerConfig = RCTConvert.playerConfig(config) else { return }
            #if os(iOS)
            self?.setupRemoteControlConfig(playerConfig.remoteControlConfig)
            #endif
            if let networkNativeId, let networkConfig = self?.setupNetworkConfig(nativeId: networkNativeId) {
                playerConfig.networkConfig = networkConfig
            }
            self?.setupImaBeforeInitialization(nativeId: nativeId, config: config, playerConfig: playerConfig)
            let player = PlayerFactory.create(playerConfig: playerConfig)
            PlayerRegistry.register(player: player, nativeId: nativeId)
            #if canImport(GoogleInteractiveMediaAds) && os(iOS)
            self?.adsWrappers[nativeId] = IMAAdsWrapper(player: player)
            #endif
        }.runOnQueue(.main)
        AsyncFunction(
            "initializeWithAnalyticsConfig"
        ) { [weak self] (nativeId: NativeId, analyticsConfigJson: [String: Any]?, config: [String: Any]?, networkNativeId: NativeId?, _: String?) in // swiftlint:disable:this line_length
            guard !PlayerRegistry.hasPlayer(nativeId: nativeId),
                  let playerConfig = RCTConvert.playerConfig(config),
                  let analyticsConfig = RCTConvert.analyticsConfig(analyticsConfigJson) else { return }
            #if os(iOS)
            self?.setupRemoteControlConfig(playerConfig.remoteControlConfig)
            #endif
            if let networkNativeId, let networkConfig = self?.setupNetworkConfig(nativeId: networkNativeId) {
                playerConfig.networkConfig = networkConfig
            }
            self?.setupImaBeforeInitialization(nativeId: nativeId, config: config, playerConfig: playerConfig)
            let defaultMetadata = RCTConvert.analyticsDefaultMetadataFromAnalyticsConfig(analyticsConfigJson)
            let player = PlayerFactory.create(
                playerConfig: playerConfig,
                analyticsConfig: analyticsConfig,
                defaultMetadata: defaultMetadata ?? DefaultMetadata()
            )
            PlayerRegistry.register(player: player, nativeId: nativeId)
            #if canImport(GoogleInteractiveMediaAds) && os(iOS)
            self?.adsWrappers[nativeId] = IMAAdsWrapper(player: player)
            #endif
        }.runOnQueue(.main)
        // swiftlint:disable:next line_length
        AsyncFunction("loadDaiStream") { [weak self] (nativeId: NativeId, assetId: String, fallbackUrl: String, adTagParams: [String: Any]?) in
            guard let player = PlayerRegistry.getPlayer(nativeId: nativeId) else { return }
            #if canImport(GoogleInteractiveMediaAds) && os(iOS)
            if let adsWrapper = self?.adsWrappers[nativeId] {
                adsWrapper.setFallbackUrl(fallbackUrl)
                adsWrapper.setAdTagParams(adTagParams)
                adsWrapper.requestAndLoadStream(assetId)
            } else {
                self?.loadFallbackUrl(player: player, fallbackUrl: fallbackUrl)
            }
            #else
            self?.loadFallbackUrl(player: player, fallbackUrl: fallbackUrl)
            #endif
        }.runOnQueue(.main)
        AsyncFunction("loadSource") { [weak self] (nativeId: NativeId, sourceNativeId: NativeId) in
            guard let player = PlayerRegistry.getPlayer(nativeId: nativeId),
                  let sourceModule = self?.appContext?.moduleRegistry.get(SourceModule.self),
                  let source = sourceModule.retrieve(sourceNativeId) else { return }
            player.load(source: source)
        }.runOnQueue(.main)
    }

    /// This needs to stay stable to maintain compatibility for cross-module access..
    @objc
    public func retrieve(_ nativeId: NativeId) -> Player? {
        PlayerRegistry.getPlayer(nativeId: nativeId)
    }

    #if canImport(GoogleInteractiveMediaAds) && os(iOS)
    /// Assigns the ad container view for IMA DAI. Call from the player view when the native view is attached.
    public func assignAdContainer(nativeId: NativeId, adUiContainer: UIView) {
        adsWrappers[nativeId]?.setAdUiContainer(adUiContainer)
    }
    #endif

    private func setupRemoteControlConfig(_ remoteControlConfig: RemoteControlConfig) {
        remoteControlConfig.prepareSource = { [weak self] _, sourceConfig in
            guard let sourceModule = self?.appContext?.moduleRegistry.get(SourceModule.self),
                  let sourceNativeId = sourceModule.nativeId(where: { $0.sourceConfig === sourceConfig }),
                  let castSourceConfig = sourceModule.retrieveCastSourceConfig(sourceNativeId) else {
                return nil
            }

            return castSourceConfig
        }
    }

    private func setupNetworkConfig(nativeId: NativeId) -> NetworkConfig? {
        guard let networkModule = self.appContext?.moduleRegistry.get(NetworkModule.self) else {
            return nil
        }
        return networkModule.retrieve(nativeId)
    }

    private func setupImaBeforeInitialization(
        nativeId: NativeId,
        config: [String: Any]?,
        playerConfig: PlayerConfig
    ) {
        guard
            let advertisingJson = config?["advertisingConfig"] as? [String: Any],
            let imaJson = advertisingJson["ima"] as? [String: Any],
            imaJson["beforeInitialization"] != nil
        else {
            return
        }

        playerConfig.advertisingConfig.beforeInitialization = { [weak self] settings in
            guard let self else { return }
            let (id, wait) = imaSettingsWaiter.make(timeout: 0.25)
            let payload = RCTConvert.imaSettingsDictionary(settings)
            self.sendEvent(
                "onImaBeforeInitialization",
                [
                    "nativeId": nativeId,
                    "id": id,
                    "settings": payload
                ]
            )
            guard let updated = wait() else { return }
            RCTConvert.applyImaSettings(settings, from: updated)
        }
    }

    /// Loads the fallback URL into the player (e.g. when IMA is unavailable or not configured).
    private func loadFallbackUrl(player: Player, fallbackUrl: String) {
        guard let url = URL(string: fallbackUrl) else { return }
        let sourceConfig = SourceConfig(url: url, type: .hls)
        player.load(sourceConfig: sourceConfig)
    }
}
