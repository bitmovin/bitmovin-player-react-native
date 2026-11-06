import BitmovinCollector
import BitmovinPlayer
import ExpoModulesCore
import ExpoModulesJSI

public class PlayerModule: Module {
    // swiftlint:disable:next function_body_length
    public func definition() -> ModuleDefinition {
        Name("PlayerModule")
        Constant("isGoogleImaEnabled") {
            NSClassFromString("IMAAdsLoader") != nil
        }
        Function("createEmpty") { SharedPlayer() }
        AsyncFunction("create") { (config: [String: Any]?, analytics: [String: Any]?, network: SharedNetwork?, _: SharedObject?, callback: JavaScriptValue?) -> SharedPlayer in // swiftlint:disable:this line_length
            let owner = SharedPlayer()
            owner.callback = try callback.map { try CallbackScope(callback: $0, context: appContext) }
            owner.initialize(config: config, network: network, analyticsConfig: analytics)
            return owner
        }.runOnQueue(.main)
        Class("Player", SharedPlayer.self) {
            AsyncFunction("play") { (owner: SharedPlayer) in
                owner.player?.play()
            }.runOnQueue(.main)
            AsyncFunction("pause") { (owner: SharedPlayer) in
                owner.player?.pause()
            }.runOnQueue(.main)
            AsyncFunction("mute") { (owner: SharedPlayer) in
                owner.player?.mute()
            }.runOnQueue(.main)
            AsyncFunction("unmute") { (owner: SharedPlayer) in
                owner.player?.unmute()
            }.runOnQueue(.main)
            AsyncFunction("seek") { (owner: SharedPlayer, time: Double) in
                owner.player?.seek(time: time)
            }.runOnQueue(.main)
            AsyncFunction("timeShift") { (owner: SharedPlayer, offset: Double) in
                owner.player?.timeShift = offset
            }.runOnQueue(.main)
            AsyncFunction("destroy") { (owner: SharedPlayer) in
                owner.destroy()
            }.runOnQueue(.main)
            AsyncFunction("setVolume") { (owner: SharedPlayer, volume: Int) in
                owner.player?.volume = volume
            }.runOnQueue(.main)
            AsyncFunction("unload") { (owner: SharedPlayer) in
                owner.player?.unload()
                owner.source = nil
            }.runOnQueue(.main)
            AsyncFunction("setPlaybackSpeed") { (owner: SharedPlayer, playbackSpeed: Float) in
                owner.player?.playbackSpeed = playbackSpeed
            }.runOnQueue(.main)
            AsyncFunction("setMaxSelectableBitrate") { (owner: SharedPlayer, maxSelectableBitrate: Int) in
                owner.player?.maxSelectableBitrate = UInt(maxSelectableBitrate)
            }.runOnQueue(.main)
            AsyncFunction("getVolume") { (owner: SharedPlayer) -> Int? in
                owner.player?.volume
            }.runOnQueue(.main)
            AsyncFunction("currentTime") { (owner: SharedPlayer, mode: String?) -> Double? in
                let player = owner.player
                if let mode {
                    return player?.currentTime(RCTConvert.timeMode(mode))
                }
                return player?.currentTime
            }.runOnQueue(.main)
            AsyncFunction("isPlaying") { (owner: SharedPlayer) -> Bool? in
                owner.player?.isPlaying
            }.runOnQueue(.main)
            AsyncFunction("isPaused") { (owner: SharedPlayer) -> Bool? in
                owner.player?.isPaused
            }.runOnQueue(.main)
            AsyncFunction("duration") { (owner: SharedPlayer) -> Double? in
                owner.player?.duration
            }.runOnQueue(.main)
            AsyncFunction("isMuted") { (owner: SharedPlayer) -> Bool? in
                owner.player?.isMuted
            }.runOnQueue(.main)
            AsyncFunction("getTimeShift") { (owner: SharedPlayer) -> Double? in
                owner.player?.timeShift
            }.runOnQueue(.main)
            AsyncFunction("isLive") { (owner: SharedPlayer) -> Bool? in
                owner.player?.isLive
            }.runOnQueue(.main)
            AsyncFunction("getMaxTimeShift") { (owner: SharedPlayer) -> Double? in
                owner.player?.maxTimeShift
            }.runOnQueue(.main)
            AsyncFunction("getPlaybackSpeed") { (owner: SharedPlayer) -> Float? in
                owner.player?.playbackSpeed
            }.runOnQueue(.main)
            AsyncFunction("isAd") { (owner: SharedPlayer) -> Bool? in
                owner.player?.isAd
            }.runOnQueue(.main)
            AsyncFunction("canPlayAtPlaybackSpeed") { (owner: SharedPlayer, playbackSpeed: Float) -> Bool? in
                owner.player?.canPlay(atPlaybackSpeed: playbackSpeed)
            }.runOnQueue(.main)
            AsyncFunction("getAudioTrack") { (owner: SharedPlayer) -> [String: Any]? in
                RCTConvert.audioTrackJson(owner.player?.audio)
            }.runOnQueue(.main)
            AsyncFunction("getAvailableAudioTracks") { (owner: SharedPlayer) -> [[String: Any]] in
                owner.player?
                    .availableAudio.compactMap { RCTConvert.audioTrackJson($0) } ?? []
            }.runOnQueue(.main)
            AsyncFunction("setAudioTrack") { (owner: SharedPlayer, trackIdentifier: String) in
                owner.player?.setAudio(trackIdentifier: trackIdentifier)
            }.runOnQueue(.main)
            AsyncFunction("getSubtitleTrack") { (owner: SharedPlayer) -> [String: Any]? in
                RCTConvert.subtitleTrackJson(owner.player?.subtitle)
            }.runOnQueue(.main)
            AsyncFunction("getAvailableSubtitles") { (owner: SharedPlayer) -> [[String: Any]] in
                owner.player?
                    .availableSubtitles
                    .compactMap { RCTConvert.subtitleTrackJson($0) } ?? []
            }.runOnQueue(.main)
            AsyncFunction("setSubtitleTrack") { (owner: SharedPlayer, trackIdentifier: String?) in
                owner.player?.setSubtitle(trackIdentifier: trackIdentifier)
            }.runOnQueue(.main)

            AsyncFunction("getVideoQuality") { (owner: SharedPlayer) -> [String: Any]? in
                RCTConvert.toJson(videoQuality: owner.player?.videoQuality)
            }.runOnQueue(.main)
            AsyncFunction("getAvailableVideoQualities") { (owner: SharedPlayer) -> [[String: Any]] in
                owner.player?
                    .availableVideoQualities.compactMap { RCTConvert.toJson(videoQuality: $0) } ?? []
            }.runOnQueue(.main)
            AsyncFunction("getThumbnail") { (owner: SharedPlayer, time: Double) -> [String: Any]? in
                RCTConvert.toJson(thumbnail: owner.player?.thumbnail(forTime: time))
            }.runOnQueue(.main)
            AsyncFunction("loadOfflineContent") { (owner: SharedPlayer, offline: SharedOffline, options: [String: Any]?) in // swiftlint:disable:this line_length
                #if os(iOS)
                guard let player = owner.player,
                      let offlineContentManagerBridge = offline.bridge else { return }
                let optionsDictionary = options ?? [:]
                let restrictedToAssetCache = optionsDictionary["restrictedToAssetCache"] as? Bool ?? true
                let offlineSourceConfig = offlineContentManagerBridge.offlineContentManager.createOfflineSourceConfig(
                    restrictedToAssetCache: restrictedToAssetCache
                )
                guard let offlineSourceConfig else { return }
                player.load(sourceConfig: offlineSourceConfig)
                #endif
            }.runOnQueue(.main)
            AsyncFunction("scheduleAd") { (owner: SharedPlayer, adItemJson: [String: Any]) in
                guard let adItem = RCTConvert.adItem(adItemJson) else { return }
                owner.player?.scheduleAd(adItem: adItem)
            }.runOnQueue(.main)
            AsyncFunction("isAirPlayActive") { (owner: SharedPlayer) -> Bool? in
                #if os(iOS)
                owner.player?.isAirPlayActive
                #else
                nil
                #endif
            }.runOnQueue(.main)
            AsyncFunction("isAirPlayAvailable") { (owner: SharedPlayer) -> Bool? in
                #if os(iOS)
                owner.player?.allowsAirPlay
                #else
                nil
                #endif
            }.runOnQueue(.main)
            AsyncFunction("showAirPlayTargetPicker") { (owner: SharedPlayer) in
                #if os(iOS)
                owner.player?.showAirPlayTargetPicker()
                #endif
            }.runOnQueue(.main)
            AsyncFunction("isCastAvailable") { (owner: SharedPlayer) -> Bool? in
                owner.player?.isCastAvailable
            }.runOnQueue(.main)
            AsyncFunction("isCasting") { (owner: SharedPlayer) -> Bool? in
                owner.player?.isCasting
            }.runOnQueue(.main)
            AsyncFunction("castVideo") { (owner: SharedPlayer) in
                owner.player?.castVideo()
            }.runOnQueue(.main)
            AsyncFunction("castStop") { (owner: SharedPlayer) in
                owner.player?.castStop()
            }.runOnQueue(.main)
            AsyncFunction("skipAd") { (owner: SharedPlayer) in
                owner.player?.skipAd()
            }.runOnQueue(.main)
            AsyncFunction("getBufferLevel") { (owner: SharedPlayer, type: String) -> [String: Any]? in
                guard let player = owner.player, let bufferType = RCTConvert.bufferType(type) else { return nil }
                let level = player.buffer.getLevel(bufferType)
                return RCTConvert.toJson(bufferLevels: RNBufferLevels(audio: level, video: level))
            }.runOnQueue(.main)
            AsyncFunction("setBufferTargetLevel") { (owner: SharedPlayer, type: String, value: Double) in
                guard RCTConvert.bufferType(type) == .forwardDuration else { return }
                owner.player?.buffer.setTargetLevel(value)
            }.runOnQueue(.main)
            AsyncFunction("sendCustomDataEvent") { (owner: SharedPlayer, json: [String: Any]) in
                guard let analytics = owner.player?.analytics,
                      let customData = RCTConvert.analyticsCustomData(json) else { return }
                analytics.sendCustomDataEvent(customData: customData)
            }.runOnQueue(.main)
            AsyncFunction("getAnalyticsUserId") { (owner: SharedPlayer) -> String? in
                owner.player?.analytics?.userId
            }.runOnQueue(.main)
            AsyncFunction("isMediaControlsEnabled") { (owner: SharedPlayer) -> Bool? in
                owner.player?.nowPlaying.isEnabled
            }.runOnQueue(.main)
            AsyncFunction("setMediaControlsEnabled") { (owner: SharedPlayer, enabled: Bool) in
                owner.player?.nowPlaying.isEnabled = enabled
            }.runOnQueue(.main)
            AsyncFunction("loadSource") { (owner: SharedPlayer, source: SharedSource) in
                guard let player = owner.player, let nativeSource = source.source else { return }
                owner.source = source
                player.load(source: nativeSource)
            }.runOnQueue(.main)
        }
    }
}

public final class SharedPlayer: SharedObject {
    private var nativePlayer: Player?
    var player: Player? {
        get { isClosed.value ? nil : nativePlayer }
        set {
            guard !isClosed.value else {
                newValue?.destroy()
                return
            }
            nativePlayer = newValue
        }
    }
    var source: SharedSource?
    private var network: SharedNetwork?
    fileprivate var callback: CallbackScope?
    fileprivate let isClosed = LockedBox(value: false)
    deinit {
        // Runtime shutdown clears Expo's association registry without invoking release hooks.
        // Capture only the SDK resource so its final destruction still happens on the main thread.
        if let playerToDestroy = nativePlayer {
            DispatchQueue.main.async {
                playerToDestroy.destroy()
            }
        }
        callback?.close()
    }

    override public func sharedObjectWillRelease() {
        isClosed.update(true)
        callback?.close()
        // IMA requires player destruction on the main thread. Keep the owner alive until cleanup runs.
        DispatchQueue.main.async {
            self.destroy()
        }
    }

    func destroy() {
        isClosed.update(true)
        let playerToDestroy = nativePlayer
        nativePlayer = nil
        callback?.close()
        // Keep listeners attached for the SDK's final DestroyEvent.
        playerToDestroy?.destroy()
        source = nil
        network = nil
        callback = nil
    }

    fileprivate func initialize(
        config: [String: Any]?,
        network: SharedNetwork?,
        analyticsConfig: [String: Any]? = nil
    ) {
        guard !isClosed.value, player == nil, let playerConfig = RCTConvert.playerConfig(config) else { return }
        let analytics = analyticsConfig.flatMap { RCTConvert.analyticsConfig($0) }
        guard analyticsConfig == nil || analytics != nil else { return }
#if os(iOS)
        setupRemoteControlConfig(playerConfig.remoteControlConfig)
#endif
        self.network = network
        if let networkConfig = network?.config { playerConfig.networkConfig = networkConfig }
        setupShouldLoadAdItem(config: config, playerConfig: playerConfig)
        setupImaBeforeInitialization(config: config, playerConfig: playerConfig)
        if let analytics {
            let defaultMetadata = RCTConvert.analyticsDefaultMetadataFromAnalyticsConfig(analyticsConfig)
            player = PlayerFactory.create(
                playerConfig: playerConfig,
                analyticsConfig: analytics,
                defaultMetadata: defaultMetadata ?? DefaultMetadata()
            )
        } else {
            player = PlayerFactory.create(playerConfig: playerConfig)
        }
    }

    fileprivate func setupRemoteControlConfig(_ remoteControlConfig: RemoteControlConfig) {
        remoteControlConfig.prepareSource = { [weak self] _, sourceConfig in
            guard let source = self?.source, source.source?.sourceConfig === sourceConfig else {
                return nil
            }
            return source.castSourceConfig
        }
    }

    fileprivate func setupShouldLoadAdItem(
        config: [String: Any]?,
        playerConfig: PlayerConfig
    ) {
        guard
            let advertisingJson = config?["advertisingConfig"] as? [String: Any],
            advertisingJson["shouldLoadAdItem"] != nil
        else {
            return
        }

        playerConfig.advertisingConfig.shouldLoadAdItem = { [weak self] adItem in
            self?.callback?.call(
                "shouldLoadAdItem", arguments: [RCTConvert.toJson(adItem: adItem) as Any]
            ) as? Bool ?? true
        }
    }

    fileprivate func setupImaBeforeInitialization(
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
            guard let value = self?.callback?.call(
                "imaBeforeInitialization", arguments: [RCTConvert.imaSettingsDictionary(settings)]
            ) as? [String: Any] else { return }
            RCTConvert.applyImaSettings(settings, from: value)
        }
    }
}
