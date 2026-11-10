import BitmovinCollector
import BitmovinPlayer
import ExpoModulesCore
import ExpoModulesJSI

// swiftlint:disable:next type_body_length
public class PlayerModule: Module {
    private let shouldLoadAdItemWaiter = ResultWaiter<Bool>()
    private let imaSettingsWaiter = ResultWaiter<[String: Any]>()
    private lazy var eventRelay = EventRelay<Player>(
        subscribers: PlayerEventTypes.player
    ) { [weak self] nativeId, eventName, event in
        self?.sendEvent("onPlayerEvent", [
            "nativeId": nativeId,
            "eventName": eventName,
            "event": event.eventPayload(),
        ])
    }
    private lazy var removedSourceReleaser = RemovedSourceReleaser { [weak self] nativeId in
        self?.appContext?.moduleRegistry.get(SourceModule.self)?.releaseSource(nativeId: nativeId)
    }

    // swiftlint:disable:next function_body_length
    public func definition() -> ModuleDefinition {
        Name("PlayerModule")
        AsyncFunction("getSharedPlayer") { (nativeId: NativeId) -> SharedPlayer in
            guard let owner = PlayerRegistry.getSharedPlayer(nativeId: nativeId) else {
                throw Exception(name: "PlayerNotInitialized", description: "Player has not been initialized")
            }
            return owner
        }.runOnQueue(.main)
        Class("Player", SharedPlayer.self) {
            AsyncFunction("isMediaControlsEnabled") { (owner: SharedPlayer) -> Bool? in
                owner.player.nowPlaying.isEnabled
            }.runOnQueue(.main)
            AsyncFunction("setMediaControlsEnabled") { (owner: SharedPlayer, enabled: Bool) in
                owner.player.nowPlaying.isEnabled = enabled
            }.runOnQueue(.main)
            AsyncFunction("sendCustomDataEvent") { (owner: SharedPlayer, json: [String: Any]) in
                guard let analytics = owner.player.analytics,
                      let customData = RCTConvert.analyticsCustomData(json) else { return }
                analytics.sendCustomDataEvent(customData: customData)
            }.runOnQueue(.main)
            AsyncFunction("getAnalyticsUserId") { (owner: SharedPlayer) -> String? in
                owner.player.analytics?.userId
            }.runOnQueue(.main)
            AsyncFunction("getBufferLevel") { (owner: SharedPlayer, type: String) -> [String: Any]? in
                guard let bufferType = RCTConvert.bufferType(type) else { return nil }
                let level = owner.player.buffer.getLevel(bufferType)
                return [
                    "audio": RCTConvert.toJson(bufferLevel: level, mediaType: "audio"),
                    "video": RCTConvert.toJson(bufferLevel: level, mediaType: "video")
                ]
            }.runOnQueue(.main)
            AsyncFunction("setBufferTargetLevel") { (owner: SharedPlayer, type: String, value: Double) in
                guard RCTConvert.bufferType(type) == .forwardDuration else { return }
                owner.player.buffer.setTargetLevel(value)
            }.runOnQueue(.main)
        }
        OnCreate {}
        OnDestroy {
            // Destroy all players on the main thread when the module is deallocated.
            // This is necessary when the IMA SDK is present in the app,
            // as it may crash if the players are destroyed on a background thread.
            // The lazy event relay and source releaser are read on the main thread as well, so they are not created
            // on another thread if no player was ever created.
            DispatchQueue.main.async { [self] in
                // Cancel the event subscriptions first, so destroying the players does not emit into this module.
                eventRelay.clear()
                removedSourceReleaser.clear()
                PlayerRegistry.getAllNativeIds().forEach {
                    PlayerRegistry.getSharedPlayer(nativeId: $0)?.closeCallbacks()
                }
                PlayerRegistry.getAllPlayers().forEach { $0.destroy() }
                PlayerRegistry.clear()
            }
            shouldLoadAdItemWaiter.removeAll()
            imaSettingsWaiter.removeAll()
        }
        Events("onShouldLoadAdItem", "onImaBeforeInitialization", "onPlayerEvent")
        AsyncFunction("on") { [weak self] (nativeId: NativeId, eventName: String) in
            self?.eventRelay.on(
                nativeId: nativeId,
                emitter: PlayerRegistry.getPlayer(nativeId: nativeId),
                eventName: eventName
            )
        }.runOnQueue(.main)
        AsyncFunction("off") { [weak self] (nativeId: NativeId, eventName: String) in
            self?.eventRelay.off(nativeId: nativeId, eventName: eventName)
        }.runOnQueue(.main)
        Constant("isGoogleImaEnabled") {
            NSClassFromString("IMAAdsLoader") != nil
        }
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
            if let owner = PlayerRegistry.getSharedPlayer(nativeId: nativeId) {
                owner.closeCallbacks()
                owner.player.destroy()
                PlayerRegistry.unregister(nativeId: nativeId)
            }
            // Detach only after destroying, so the sources that `destroy` removes while unloading are released.
            self?.removedSourceReleaser.detach(nativeId: nativeId)
            self?.eventRelay.offAll(nativeId: nativeId)
            self?.appContext?.moduleRegistry.get(RNPlayerViewManager.self)?
                .discardPendingPictureInPictureValues(playerId: nativeId)
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
        AsyncFunction("showAirPlayTargetPicker") { (nativeId: NativeId) in
            #if os(iOS)
            PlayerRegistry.getPlayer(nativeId: nativeId)?.showAirPlayTargetPicker()
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
        AsyncFunction("setShouldLoadAdItem") { [weak self] (id: Int, shouldLoad: Bool) in
            self?.shouldLoadAdItemWaiter.complete(id: id, with: shouldLoad)
        }
        AsyncFunction("initializeWithConfig") { (nativeId: NativeId, config: [String: Any]?, callback: JavaScriptValue?) -> SharedPlayer in // swiftlint:disable:this line_length
            try self.initializePlayer(nativeId: nativeId, config: config, callbackValue: callback)
        }.runOnQueue(.main)
        AsyncFunction("initializeWithAnalyticsConfig") { (nativeId: NativeId, analytics: [String: Any]?, config: [String: Any]?, callback: JavaScriptValue?) -> SharedPlayer in // swiftlint:disable:this line_length
            try self.initializePlayer(
                nativeId: nativeId, config: config, callbackValue: callback, analyticsConfigJson: analytics
            )
        }.runOnQueue(.main)
        AsyncFunction("loadSource") { [weak self] (nativeId: NativeId, sourceNativeId: NativeId) in
            guard let player = PlayerRegistry.getPlayer(nativeId: nativeId),
                  let sourceModule = self?.appContext?.moduleRegistry.get(SourceModule.self),
                  let source = sourceModule.retrieve(sourceNativeId) else { return }
            player.load(source: source)
        }.runOnQueue(.main)
        AsyncFunction("loadPlaylist") { [weak self] (nativeId: NativeId, sourceNativeIds: [NativeId], options: [String: Any]?) in // swiftlint:disable:this line_length
            try self?.loadPlaylist(nativeId: nativeId, sourceNativeIds: sourceNativeIds, options: options)
        }.runOnQueue(.main)
        AsyncFunction("source") { (nativeId: NativeId) -> NativeId? in
            PlayerRegistry.getPlayer(nativeId: nativeId)?.source.flatMap { SourceRegistry.nativeId(of: $0) }
        }.runOnQueue(.main)
    }

    /// This needs to stay stable to maintain compatibility for cross-module access..
    @objc
    public func retrieve(_ nativeId: NativeId) -> Player? {
        PlayerRegistry.getPlayer(nativeId: nativeId)
    }

    private func loadPlaylist(nativeId: NativeId, sourceNativeIds: [NativeId], options: [String: Any]?) throws {
        guard let player = PlayerRegistry.getPlayer(nativeId: nativeId),
              let sourceModule = appContext?.moduleRegistry.get(SourceModule.self) else { return }
        let sources = try sourceNativeIds.map { sourceNativeId in
            guard let source = sourceModule.retrieve(sourceNativeId) else {
                throw Exception(
                    name: "SOURCE_NOT_INITIALIZED",
                    description: "Source \(sourceNativeId) is not initialized"
                )
            }
            return source
        }
        // The SDK unloads the current session and then raises a `fatalError` for an invalid playlist config,
        // so everything is validated before loading.
        try Self.validatePlaylistSources(sources, sourceNativeIds: sourceNativeIds, player: player)
        let playlistOptions = try RCTConvert.playlistOptions(options)
        player.load(playlistConfig: PlaylistConfig(sources: sources, options: playlistOptions))
    }

    private static let supportedPlaylistSourceTypes: [SourceType] = [.hls, .progressive, .movpkg]

    /// Throws if the iOS SDK cannot play `source` as part of a playlist.
    internal static func validatePlaylistSourceType(_ source: Source, sourceNativeId: NativeId) throws {
        guard supportedPlaylistSourceTypes.contains(source.sourceConfig.type) else {
            throw Exception(
                name: "UNSUPPORTED_PLAYLIST_SOURCE",
                description: "Source \(sourceNativeId) cannot be part of a playlist on iOS: only HLS, progressive and movpkg sources are supported" // swiftlint:disable:this line_length
            )
        }
    }

    private static func validatePlaylistSources(
        _ sources: [Source],
        sourceNativeIds: [NativeId],
        player: Player
    ) throws {
        guard !sources.isEmpty else {
            throw Exception(name: "EMPTY_PLAYLIST", description: "Playlist config has no sources")
        }
        let sourcesWithNativeIds = zip(sources, sourceNativeIds)
        for (source, sourceNativeId) in sourcesWithNativeIds {
            try validatePlaylistSourceType(source, sourceNativeId: sourceNativeId)
        }
        // The SDK ignores a source listed more than once and only logs a warning.
        var seenSources = Set<ObjectIdentifier>()
        for (source, sourceNativeId) in sourcesWithNativeIds
        where !seenSources.insert(ObjectIdentifier(source as AnyObject)).inserted {
            throw Exception(
                name: "DUPLICATE_PLAYLIST_SOURCE",
                description: "Source \(sourceNativeId) is part of the playlist more than once"
            )
        }
        // The SDK raises a `fatalError` for a source attached to another player. Sources of this player's
        // current session are fine, as loading unloads the session first.
        let sessionSources = Set(player.playlist.sources.map { ObjectIdentifier($0 as AnyObject) })
        for (source, sourceNativeId) in sourcesWithNativeIds
        where source.isAttachedToPlayer && !sessionSources.contains(ObjectIdentifier(source as AnyObject)) {
            throw Exception(
                name: "SOURCE_ALREADY_ATTACHED",
                description: "Source \(sourceNativeId) is already attached to another player"
            )
        }
    }

    /**
     Keeps `source` registered if its release is pending, see `RemovedSourceReleaser.keep(_:)`.
     */
    internal func keepSource(_ source: Source) {
        removedSourceReleaser.keep(source)
    }

    private func initializePlayer(
        nativeId: NativeId,
        config: [String: Any]?,
        callbackValue: JavaScriptValue?,
        analyticsConfigJson: [String: Any]? = nil
    ) throws -> SharedPlayer {
        if let existing = PlayerRegistry.getSharedPlayer(nativeId: nativeId) { return existing }
        let callback = try callbackValue.map { try CallbackScope(callback: $0, context: appContext) }
        guard let playerConfig = RCTConvert.playerConfig(config ?? [:]) else {
            callback?.close()
            throw Exception(name: "InvalidPlayerConfig", description: "Invalid player configuration")
        }
        #if os(iOS)
        setupRemoteControlConfig(playerConfig.remoteControlConfig)
        #endif
        if let network = RCTConvert.networkConfig(config?["networkConfig"], callback: callback) {
            playerConfig.networkConfig = network
        }
        setupShouldLoadAdItem(nativeId: nativeId, config: config, playerConfig: playerConfig)
        setupImaBeforeInitialization(nativeId: nativeId, config: config, playerConfig: playerConfig)
        let player: Player
        if let analyticsConfigJson {
            guard let analytics = RCTConvert.analyticsConfig(analyticsConfigJson) else {
                callback?.close()
                throw Exception(name: "InvalidAnalyticsConfig", description: "Invalid analytics configuration")
            }
            let metadata = RCTConvert.analyticsDefaultMetadataFromAnalyticsConfig(analyticsConfigJson)
            player = PlayerFactory.create(
                playerConfig: playerConfig, analyticsConfig: analytics, defaultMetadata: metadata ?? DefaultMetadata()
            )
        } else {
            player = PlayerFactory.create(playerConfig: playerConfig)
        }
        PlayerRegistry.register(player: player, nativeId: nativeId, callback: callback)
        removedSourceReleaser.attach(nativeId: nativeId, player: player)
        guard let owner = PlayerRegistry.getSharedPlayer(nativeId: nativeId) else {
            callback?.close()
            throw Exception(name: "PlayerNotInitialized", description: "Player registration failed")
        }
        return owner
    }

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

    private func setupShouldLoadAdItem(
        nativeId: NativeId,
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
            guard let self else { return true }
            let (id, wait) = shouldLoadAdItemWaiter.make(timeout: 0.25)
            self.sendEvent(
                "onShouldLoadAdItem",
                [
                    "nativeId": nativeId,
                    "id": id,
                    "adItem": RCTConvert.toJson(adItem: adItem) as Any
                ]
            )
            return wait() ?? true
        }
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
}
