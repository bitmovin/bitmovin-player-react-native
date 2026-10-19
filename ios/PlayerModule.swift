import BitmovinPlayer
import ExpoModulesCore

// swiftlint:disable:next type_body_length
public class PlayerModule: Module {
    private let shouldLoadAdItemWaiter = ResultWaiter<Bool>()
    private let imaSettingsWaiter = ResultWaiter<[String: Any]>()
    private lazy var playlistEventEmitter = PlaylistEventEmitter(module: self)

    // swiftlint:disable:next function_body_length cyclomatic_complexity
    public func definition() -> ModuleDefinition {
        Name("PlayerModule")
        OnCreate {}
        OnDestroy {
            // Destroy all players on the main thread when the module is deallocated.
            // This is necessary when the IMA SDK is present in the app,
            // as it may crash if the players are destroyed on a background thread.
            DispatchQueue.main.async {
                PlayerRegistry.getAllPlayers().forEach {
                    $0.remove(listener: self.playlistEventEmitter)
                    $0.destroy()
                }
                PlayerRegistry.clear()
            }
            shouldLoadAdItemWaiter.removeAll()
            imaSettingsWaiter.removeAll()
        }
        Events(
            "onShouldLoadAdItem",
            "onImaBeforeInitialization",
            "onSourceAdded",
            "onSourceRemoved",
            "onPlaylistTransition"
        )
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
        AsyncFunction("destroy") { (nativeId: NativeId) in
            if let player = PlayerRegistry.getPlayer(nativeId: nativeId) {
                player.remove(listener: self.playlistEventEmitter)
                player.destroy()
                PlayerRegistry.unregister(nativeId: nativeId)
            }
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
            self?.setupShouldLoadAdItem(nativeId: nativeId, config: config, playerConfig: playerConfig)
            self?.setupImaBeforeInitialization(nativeId: nativeId, config: config, playerConfig: playerConfig)
            let player = PlayerFactory.create(playerConfig: playerConfig)
            if let playlistEventEmitter = self?.playlistEventEmitter {
                player.add(listener: playlistEventEmitter)
            }
            PlayerRegistry.register(player: player, nativeId: nativeId)
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
            self?.setupShouldLoadAdItem(nativeId: nativeId, config: config, playerConfig: playerConfig)
            self?.setupImaBeforeInitialization(nativeId: nativeId, config: config, playerConfig: playerConfig)
            let defaultMetadata = RCTConvert.analyticsDefaultMetadataFromAnalyticsConfig(analyticsConfigJson)
            let player = PlayerFactory.create(
                playerConfig: playerConfig,
                analyticsConfig: analyticsConfig,
                defaultMetadata: defaultMetadata ?? DefaultMetadata()
            )
            if let playlistEventEmitter = self?.playlistEventEmitter {
                player.add(listener: playlistEventEmitter)
            }
            PlayerRegistry.register(player: player, nativeId: nativeId)
        }.runOnQueue(.main)
        AsyncFunction("loadSource") { [weak self] (nativeId: NativeId, sourceNativeId: NativeId) in
            guard let player = PlayerRegistry.getPlayer(nativeId: nativeId),
                  let sourceModule = self?.appContext?.moduleRegistry.get(SourceModule.self),
                  let source = sourceModule.retrieve(sourceNativeId) else { return }
            player.load(source: source)
        }.runOnQueue(.main)
        AsyncFunction("loadPlaylist") { [weak self] (nativeId: NativeId, sourceNativeIds: [NativeId], options: [String: Any]?) in // swiftlint:disable:this line_length
            guard let player = PlayerRegistry.getPlayer(nativeId: nativeId),
                  let sourceModule = self?.appContext?.moduleRegistry.get(SourceModule.self) else { return }
            let sources = sourceNativeIds.compactMap { sourceModule.retrieve($0) }
            guard sources.count == sourceNativeIds.count else { return }
            player.load(playlistConfig: PlaylistConfig(sources: sources, options: RCTConvert.playlistOptions(options)))
        }.runOnQueue(.main)
        AsyncFunction("playlistAddSource") { [weak self] (nativeId: NativeId, sourceNativeId: NativeId, index: Int?) in
            guard let player = PlayerRegistry.getPlayer(nativeId: nativeId),
                  let sourceModule = self?.appContext?.moduleRegistry.get(SourceModule.self),
                  let source = sourceModule.retrieve(sourceNativeId) else { return }
            if let index {
                player.playlist.add(source: source, at: index)
            } else {
                player.playlist.add(source: source)
            }
        }.runOnQueue(.main)
        AsyncFunction("playlistRemoveSource") { [weak self] (nativeId: NativeId, sourceNativeId: NativeId) in
            guard let player = PlayerRegistry.getPlayer(nativeId: nativeId),
                  let sourceModule = self?.appContext?.moduleRegistry.get(SourceModule.self),
                  let source = sourceModule.retrieve(sourceNativeId),
                  let index = player.playlist.sources.firstIndex(where: {
                      $0.sourceConfig === source.sourceConfig
                  }) else {
                return
            }
            player.playlist.remove(sourceAt: index)
        }.runOnQueue(.main)
        AsyncFunction("playlistRemoveSourceAt") { (nativeId: NativeId, index: Int) in
            PlayerRegistry.getPlayer(nativeId: nativeId)?.playlist.remove(sourceAt: index)
        }.runOnQueue(.main)
        AsyncFunction("playlistSeekToTime") { [weak self] (playerId: NativeId, sourceId: NativeId, time: Double?) in
            guard let player = PlayerRegistry.getPlayer(nativeId: playerId),
                  let sourceModule = self?.appContext?.moduleRegistry.get(SourceModule.self),
                  let source = sourceModule.retrieve(sourceId) else { return }
            player.playlist.seek(source: source, time: time ?? 0)
        }.runOnQueue(.main)
        AsyncFunction("playlistSeekToTarget") { (_: NativeId, _: NativeId, _: [String: Any]) in
            // Structured playlist seek targets are not supported by the native iOS/tvOS SDK.
        }.runOnQueue(.main)
        AsyncFunction("getPlaylistSources") { [weak self] (nativeId: NativeId) -> [NativeId] in
            guard let player = PlayerRegistry.getPlayer(nativeId: nativeId),
                  let sourceModule = self?.appContext?.moduleRegistry.get(SourceModule.self) else { return [] }
            return player.playlist.sources.compactMap { playlistSource in
                sourceModule.nativeId { $0.sourceConfig === playlistSource.sourceConfig }
            }
        }.runOnQueue(.main)
    }

    /// This needs to stay stable to maintain compatibility for cross-module access..
    @objc
    public func retrieve(_ nativeId: NativeId) -> Player? {
        PlayerRegistry.getPlayer(nativeId: nativeId)
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

    private func setupNetworkConfig(nativeId: NativeId) -> NetworkConfig? {
        guard let networkModule = self.appContext?.moduleRegistry.get(NetworkModule.self) else {
            return nil
        }
        return networkModule.retrieve(nativeId)
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

private final class PlaylistEventEmitter: NSObject, PlayerListener {
    weak var module: PlayerModule?

    init(module: PlayerModule) {
        self.module = module
    }

    func onSourceAdded(_ event: SourceAddedEvent, player: Player) {
        sendPlaylistEvent(
            eventName: "onSourceAdded",
            player: player,
            source: event.source,
            sourceIndex: event.index,
            event: event
        )
    }

    func onSourceRemoved(_ event: SourceRemovedEvent, player: Player) {
        sendPlaylistEvent(
            eventName: "onSourceRemoved",
            player: player,
            source: event.source,
            sourceIndex: event.index,
            event: event
        )
    }

    func onPlaylistTransition(_ event: PlaylistTransitionEvent, player: Player) {
        guard let module, let nativeId = PlayerRegistry.nativeId(where: { $0 === player }) else { return }
        let fromNativeId = sourceNativeId(event.from)
        let toNativeId = sourceNativeId(event.to)
        var payload = eventPayload(event)
        payload.merge(compactPayload([
            "nativeId": nativeId,
            "name": "onPlaylistTransition",
            "from": sourcePayload(event.from, nativeId: fromNativeId),
            "to": sourcePayload(event.to, nativeId: toNativeId),
            "fromSourceNativeId": fromNativeId,
            "toSourceNativeId": toNativeId
        ])) { _, new in new }
        module.sendEvent("onPlaylistTransition", NonFiniteSanitizer.sanitizeEventData(payload))
    }

    private func sendPlaylistEvent(
        eventName: String,
        player: Player,
        source: Source,
        sourceIndex: Int,
        event: Event
    ) {
        guard let module, let nativeId = PlayerRegistry.nativeId(where: { $0 === player }) else { return }
        let sourceNativeId = sourceNativeId(source)
        var payload = eventPayload(event)
        payload.merge(compactPayload([
            "nativeId": nativeId,
            "name": eventName,
            "source": sourcePayload(source, nativeId: sourceNativeId),
            "sourceNativeId": sourceNativeId,
            "index": sourceIndex
        ])) { _, new in new }
        module.sendEvent(eventName, NonFiniteSanitizer.sanitizeEventData(payload))
    }

    private func sourceNativeId(_ source: Source) -> NativeId? {
        module?.appContext?.moduleRegistry.get(SourceModule.self)?.nativeId {
            $0.sourceConfig === source.sourceConfig
        }
    }

    private func eventPayload(_ event: Event) -> [String: Any] {
        guard let jsonConvertible = event as? JsonConvertible else {
            return [
                "name": event.name,
                "timestamp": event.timestamp
            ]
        }
        return jsonConvertible.toJSON().reduce(into: [String: Any]()) { result, pair in
            if let key = pair.key as? String {
                result[key] = pair.value
            }
        }
    }

    private func sourcePayload(_ source: Source, nativeId: NativeId?) -> [String: Any] {
        var payload = source.toJSON().reduce(into: [String: Any]()) { result, pair in
            if let key = pair.key as? String {
                result[key] = pair.value
            }
        }
        payload["nativeId"] = nativeId
        return payload
    }

    private func compactPayload(_ payload: [String: Any?]) -> [String: Any] {
        payload.compactMapValues { $0 }
    }
}
