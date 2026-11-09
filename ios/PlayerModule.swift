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
        AsyncFunction("create") { (config: [String: Any]?, analytics: [String: Any]?, network: SharedNetworkConfig?, _: SharedObject?, callback: JavaScriptValue?) -> SharedPlayer in // swiftlint:disable:this line_length
            try SharedPlayer.create(
                config: config,
                network: network,
                analyticsConfig: analytics,
                callback: callback.map { try CallbackScope(callback: $0, context: appContext) }
            )
        }.runOnQueue(.main)
        Class("Player", SharedPlayer.self) {
            AsyncFunction("play") { (owner: SharedPlayer) in
                owner.player.play()
            }.runOnQueue(.main)
            AsyncFunction("pause") { (owner: SharedPlayer) in
                owner.player.pause()
            }.runOnQueue(.main)
            AsyncFunction("mute") { (owner: SharedPlayer) in
                owner.player.mute()
            }.runOnQueue(.main)
            AsyncFunction("unmute") { (owner: SharedPlayer) in
                owner.player.unmute()
            }.runOnQueue(.main)
            AsyncFunction("seek") { (owner: SharedPlayer, time: Double) in
                owner.player.seek(time: time)
            }.runOnQueue(.main)
            AsyncFunction("timeShift") { (owner: SharedPlayer, offset: Double) in
                owner.player.timeShift = offset
            }.runOnQueue(.main)
            AsyncFunction("destroy") { (owner: SharedPlayer) in
                owner.destroy()
            }.runOnQueue(.main)
            AsyncFunction("setVolume") { (owner: SharedPlayer, volume: Int) in
                owner.player.volume = volume
            }.runOnQueue(.main)
            AsyncFunction("unload") { (owner: SharedPlayer) in
                owner.player.unload()
                owner.source = nil
            }.runOnQueue(.main)
            AsyncFunction("setPlaybackSpeed") { (owner: SharedPlayer, playbackSpeed: Float) in
                owner.player.playbackSpeed = playbackSpeed
            }.runOnQueue(.main)
            AsyncFunction("setMaxSelectableBitrate") { (owner: SharedPlayer, maxSelectableBitrate: Int) in
                owner.player.maxSelectableBitrate = UInt(maxSelectableBitrate)
            }.runOnQueue(.main)
            AsyncFunction("getVolume") { (owner: SharedPlayer) -> Int? in
                owner.player.volume
            }.runOnQueue(.main)
            AsyncFunction("currentTime") { (owner: SharedPlayer, mode: String?) -> Double? in
                let player = owner.player
                if let mode {
                    return player.currentTime(RCTConvert.timeMode(mode))
                }
                return player.currentTime
            }.runOnQueue(.main)
            AsyncFunction("isPlaying") { (owner: SharedPlayer) -> Bool? in
                owner.player.isPlaying
            }.runOnQueue(.main)
            AsyncFunction("isPaused") { (owner: SharedPlayer) -> Bool? in
                owner.player.isPaused
            }.runOnQueue(.main)
            AsyncFunction("duration") { (owner: SharedPlayer) -> Double? in
                owner.player.duration
            }.runOnQueue(.main)
            AsyncFunction("isMuted") { (owner: SharedPlayer) -> Bool? in
                owner.player.isMuted
            }.runOnQueue(.main)
            AsyncFunction("getTimeShift") { (owner: SharedPlayer) -> Double? in
                owner.player.timeShift
            }.runOnQueue(.main)
            AsyncFunction("isLive") { (owner: SharedPlayer) -> Bool? in
                owner.player.isLive
            }.runOnQueue(.main)
            AsyncFunction("getMaxTimeShift") { (owner: SharedPlayer) -> Double? in
                owner.player.maxTimeShift
            }.runOnQueue(.main)
            AsyncFunction("getPlaybackSpeed") { (owner: SharedPlayer) -> Float? in
                owner.player.playbackSpeed
            }.runOnQueue(.main)
            AsyncFunction("isAd") { (owner: SharedPlayer) -> Bool? in
                owner.player.isAd
            }.runOnQueue(.main)
            AsyncFunction("canPlayAtPlaybackSpeed") { (owner: SharedPlayer, playbackSpeed: Float) -> Bool? in
                owner.player.canPlay(atPlaybackSpeed: playbackSpeed)
            }.runOnQueue(.main)
            AsyncFunction("getAudioTrack") { (owner: SharedPlayer) -> [String: Any]? in
                RCTConvert.audioTrackJson(owner.player.audio)
            }.runOnQueue(.main)
            AsyncFunction("getAvailableAudioTracks") { (owner: SharedPlayer) -> [[String: Any]] in
                owner.player
                    .availableAudio.compactMap { RCTConvert.audioTrackJson($0) }
            }.runOnQueue(.main)
            AsyncFunction("setAudioTrack") { (owner: SharedPlayer, trackIdentifier: String) in
                owner.player.setAudio(trackIdentifier: trackIdentifier)
            }.runOnQueue(.main)
            AsyncFunction("getSubtitleTrack") { (owner: SharedPlayer) -> [String: Any]? in
                RCTConvert.subtitleTrackJson(owner.player.subtitle)
            }.runOnQueue(.main)
            AsyncFunction("getAvailableSubtitles") { (owner: SharedPlayer) -> [[String: Any]] in
                owner.player
                    .availableSubtitles
                    .compactMap { RCTConvert.subtitleTrackJson($0) }
            }.runOnQueue(.main)
            AsyncFunction("setSubtitleTrack") { (owner: SharedPlayer, trackIdentifier: String?) in
                owner.player.setSubtitle(trackIdentifier: trackIdentifier)
            }.runOnQueue(.main)

            AsyncFunction("getVideoQuality") { (owner: SharedPlayer) -> [String: Any]? in
                RCTConvert.toJson(videoQuality: owner.player.videoQuality)
            }.runOnQueue(.main)
            AsyncFunction("getAvailableVideoQualities") { (owner: SharedPlayer) -> [[String: Any]] in
                owner.player
                    .availableVideoQualities.compactMap { RCTConvert.toJson(videoQuality: $0) }
            }.runOnQueue(.main)
            AsyncFunction("getThumbnail") { (owner: SharedPlayer, time: Double) -> [String: Any]? in
                RCTConvert.toJson(thumbnail: owner.player.thumbnail(forTime: time))
            }.runOnQueue(.main)
            AsyncFunction("loadOfflineContent") { (owner: SharedPlayer, offline: SharedOffline, options: [String: Any]?) in // swiftlint:disable:this line_length
                #if os(iOS)
                let player = owner.player
                guard let offlineContentManagerBridge = offline.bridge else { return }
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
                owner.player.scheduleAd(adItem: adItem)
            }.runOnQueue(.main)
            AsyncFunction("isAirPlayActive") { (owner: SharedPlayer) -> Bool? in
                #if os(iOS)
                owner.player.isAirPlayActive
                #else
                nil
                #endif
            }.runOnQueue(.main)
            AsyncFunction("isAirPlayAvailable") { (owner: SharedPlayer) -> Bool? in
                #if os(iOS)
                owner.player.allowsAirPlay
                #else
                nil
                #endif
            }.runOnQueue(.main)
            AsyncFunction("showAirPlayTargetPicker") { (owner: SharedPlayer) in
                #if os(iOS)
                owner.player.showAirPlayTargetPicker()
                #endif
            }.runOnQueue(.main)
            AsyncFunction("isCastAvailable") { (owner: SharedPlayer) -> Bool? in
                owner.player.isCastAvailable
            }.runOnQueue(.main)
            AsyncFunction("isCasting") { (owner: SharedPlayer) -> Bool? in
                owner.player.isCasting
            }.runOnQueue(.main)
            AsyncFunction("castVideo") { (owner: SharedPlayer) in
                owner.player.castVideo()
            }.runOnQueue(.main)
            AsyncFunction("castStop") { (owner: SharedPlayer) in
                owner.player.castStop()
            }.runOnQueue(.main)
            AsyncFunction("skipAd") { (owner: SharedPlayer) in
                owner.player.skipAd()
            }.runOnQueue(.main)
            AsyncFunction("getBufferLevel") { (owner: SharedPlayer, type: String) -> [String: Any]? in
                guard let bufferType = RCTConvert.bufferType(type) else { return nil }
                let player = owner.player
                let level = player.buffer.getLevel(bufferType)
                return RCTConvert.toJson(bufferLevels: RNBufferLevels(audio: level, video: level))
            }.runOnQueue(.main)
            AsyncFunction("setBufferTargetLevel") { (owner: SharedPlayer, type: String, value: Double) in
                guard RCTConvert.bufferType(type) == .forwardDuration else { return }
                owner.player.buffer.setTargetLevel(value)
            }.runOnQueue(.main)
            AsyncFunction("sendCustomDataEvent") { (owner: SharedPlayer, json: [String: Any]) in
                guard let analytics = owner.player.analytics,
                      let customData = RCTConvert.analyticsCustomData(json) else { return }
                analytics.sendCustomDataEvent(customData: customData)
            }.runOnQueue(.main)
            AsyncFunction("getAnalyticsUserId") { (owner: SharedPlayer) -> String? in
                owner.player.analytics?.userId
            }.runOnQueue(.main)
            AsyncFunction("isMediaControlsEnabled") { (owner: SharedPlayer) -> Bool? in
                owner.player.nowPlaying.isEnabled
            }.runOnQueue(.main)
            AsyncFunction("setMediaControlsEnabled") { (owner: SharedPlayer, enabled: Bool) in
                owner.player.nowPlaying.isEnabled = enabled
            }.runOnQueue(.main)
            AsyncFunction("loadSource") { (owner: SharedPlayer, source: SharedSource) in
                owner.source = source
                owner.player.load(source: source.source)
            }.runOnQueue(.main)
        }
    }
}

public final class SharedPlayer: SharedObject {
    let player: Player
    var source: SharedSource?
    private let network: SharedNetworkConfig?
    private let callback: CallbackScope?

    private init(player: Player, network: SharedNetworkConfig?, callback: CallbackScope?) {
        self.player = player
        self.network = network
        self.callback = callback
        super.init()
    }

    deinit {
        // Expo finalizers cannot await the SDK's required main-thread cleanup.
        let player = player
        DispatchQueue.main.async {
            if !player.isDestroyed { player.destroy() }
        }
        callback?.close()
    }

    func destroy() {
        callback?.close()
        // Keep listeners attached for the SDK's final DestroyEvent.
        if !player.isDestroyed { player.destroy() }
        source = nil
    }

    fileprivate static func create(
        config: [String: Any]?,
        network: SharedNetworkConfig?,
        analyticsConfig: [String: Any]?,
        callback: CallbackScope?
    ) throws -> SharedPlayer {
        let playerConfig = RCTConvert.playerConfig(config)
        let analytics = analyticsConfig.flatMap { RCTConvert.analyticsConfig($0) }
        guard analyticsConfig == nil || analytics != nil else {
            callback?.close()
            throw Exception(name: "InvalidAnalyticsConfig", description: "Invalid analytics configuration")
        }
        if let network { playerConfig.networkConfig = network.config }
        setupShouldLoadAdItem(config: config, playerConfig: playerConfig, callback: callback)
        setupImaBeforeInitialization(config: config, playerConfig: playerConfig, callback: callback)
#if os(iOS)
        weak var owner: SharedPlayer?
        playerConfig.remoteControlConfig.prepareSource = { _, sourceConfig in
            guard let source = owner?.source, source.source.sourceConfig === sourceConfig else { return nil }
            return source.castSourceConfig
        }
#endif
        let player: Player
        if let analytics {
            let metadata = RCTConvert.analyticsDefaultMetadataFromAnalyticsConfig(analyticsConfig)
            player = PlayerFactory.create(
                playerConfig: playerConfig,
                analyticsConfig: analytics,
                defaultMetadata: metadata ?? DefaultMetadata()
            )
        } else {
            player = PlayerFactory.create(playerConfig: playerConfig)
        }
        let shared = SharedPlayer(player: player, network: network, callback: callback)
#if os(iOS)
        owner = shared
#endif
        return shared
    }

    private static func setupShouldLoadAdItem(
        config: [String: Any]?,
        playerConfig: PlayerConfig,
        callback: CallbackScope?
    ) {
        guard let advertising = config?["advertisingConfig"] as? [String: Any],
              advertising["shouldLoadAdItem"] != nil else { return }
        playerConfig.advertisingConfig.shouldLoadAdItem = { adItem in
            callback?.call(
                "advertisingConfig.shouldLoadAdItem",
                arguments: [RCTConvert.toJson(adItem: adItem) as Any]
            ) as? Bool ?? true
        }
    }

    private static func setupImaBeforeInitialization(
        config: [String: Any]?,
        playerConfig: PlayerConfig,
        callback: CallbackScope?
    ) {
        guard let advertising = config?["advertisingConfig"] as? [String: Any],
              let ima = advertising["ima"] as? [String: Any], ima["beforeInitialization"] != nil else { return }
        playerConfig.advertisingConfig.beforeInitialization = { settings in
            guard let value = callback?.call(
                "advertisingConfig.ima.beforeInitialization",
                arguments: [RCTConvert.imaSettingsDictionary(settings)],
                mutating: true
            ) as? [String: Any] else { return }
            RCTConvert.applyImaSettings(settings, from: value)
        }
    }
}
