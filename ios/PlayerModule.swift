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
        Class(SharedPlayer.self) {
            Constructor { (config: JavaScriptValue?, analytics: [String: Any]?) in
                guard let appContext else { throw Exceptions.AppContextLost() }
                return try JavaScriptActor.assumeIsolated {
                    try SharedPlayer.create(config: config, analyticsConfig: analytics, context: appContext)
                }
            }
            AsyncFunction("play") { (owner: SharedPlayer) in (try owner.player).play() }.runOnQueue(.main)
            AsyncFunction("pause") { (owner: SharedPlayer) in (try owner.player).pause() }.runOnQueue(.main)
            AsyncFunction("mute") { (owner: SharedPlayer) in (try owner.player).mute() }.runOnQueue(.main)
            AsyncFunction("unmute") { (owner: SharedPlayer) in (try owner.player).unmute() }.runOnQueue(.main)
            AsyncFunction("seek") { (owner: SharedPlayer, time: Double) in
                (try owner.player).seek(time: time)
            }.runOnQueue(.main)
            AsyncFunction("timeShift") { (owner: SharedPlayer, offset: Double) in
                (try owner.player).timeShift = offset
            }.runOnQueue(.main)
            AsyncFunction("destroy") { (owner: SharedPlayer) in owner.destroy() }.runOnQueue(.main)
            AsyncFunction("setVolume") { (owner: SharedPlayer, volume: Int) in
                (try owner.player).volume = volume
            }.runOnQueue(.main)
            AsyncFunction("unload") { (owner: SharedPlayer) in
                (try owner.player).unload()
            }.runOnQueue(.main)
            AsyncFunction("setPlaybackSpeed") { (owner: SharedPlayer, playbackSpeed: Float) in
                (try owner.player).playbackSpeed = playbackSpeed
            }.runOnQueue(.main)
            AsyncFunction("setMaxSelectableBitrate") { (owner: SharedPlayer, maxSelectableBitrate: Int) in
                (try owner.player).maxSelectableBitrate = UInt(max(0, maxSelectableBitrate))
            }.runOnQueue(.main)
            AsyncFunction("getVolume") { (owner: SharedPlayer) -> Int? in (try owner.player).volume }.runOnQueue(.main)
            AsyncFunction("getCurrentTime") { (owner: SharedPlayer, mode: String?) -> Double? in
                let player = (try owner.player)
                let mode = mode ?? "absolute"
                if !mode.isEmpty {
                    return player.currentTime(RCTConvert.timeMode(mode))
                }
                return player.currentTime
            }.runOnQueue(.main)
            AsyncFunction("isPlaying") { (owner: SharedPlayer) -> Bool? in
                (try owner.player).isPlaying
            }.runOnQueue(.main)
            AsyncFunction("isPaused") { (owner: SharedPlayer) -> Bool? in
                (try owner.player).isPaused
            }.runOnQueue(.main)
            AsyncFunction("getDuration") { (owner: SharedPlayer) -> Double? in
                (try owner.player).duration
            }.runOnQueue(.main)
            AsyncFunction("isMuted") { (owner: SharedPlayer) -> Bool? in (try owner.player).isMuted }.runOnQueue(.main)
            AsyncFunction("getTimeShift") { (owner: SharedPlayer) -> Double? in
                (try owner.player).timeShift
            }.runOnQueue(.main)
            AsyncFunction("isLive") { (owner: SharedPlayer) -> Bool? in (try owner.player).isLive }.runOnQueue(.main)
            AsyncFunction("getMaxTimeShift") { (owner: SharedPlayer) -> Double? in
                (try owner.player).maxTimeShift
            }.runOnQueue(.main)
            AsyncFunction("getPlaybackSpeed") { (owner: SharedPlayer) -> Float? in
                (try owner.player).playbackSpeed
            }.runOnQueue(.main)
            AsyncFunction("isAd") { (owner: SharedPlayer) -> Bool? in (try owner.player).isAd }.runOnQueue(.main)
            AsyncFunction("canPlayAtPlaybackSpeed") { (owner: SharedPlayer, playbackSpeed: Float) -> Bool? in
                (try owner.player).canPlay(atPlaybackSpeed: playbackSpeed)
            }.runOnQueue(.main)
            AsyncFunction("getAudioTrack") { (owner: SharedPlayer) -> [String: Any]? in
                RCTConvert.audioTrackJson((try owner.player).audio)
            }.runOnQueue(.main)
            AsyncFunction("getAvailableAudioTracks") { (owner: SharedPlayer) -> [[String: Any]] in
                (try owner.player)
                    .availableAudio.compactMap { RCTConvert.audioTrackJson($0) }
            }.runOnQueue(.main)
            AsyncFunction("setAudioTrack") { (owner: SharedPlayer, trackIdentifier: String) in
                (try owner.player).setAudio(trackIdentifier: trackIdentifier)
            }.runOnQueue(.main)
            AsyncFunction("getSubtitleTrack") { (owner: SharedPlayer) -> [String: Any]? in
                RCTConvert.subtitleTrackJson((try owner.player).subtitle)
            }.runOnQueue(.main)
            AsyncFunction("getAvailableSubtitles") { (owner: SharedPlayer) -> [[String: Any]] in
                (try owner.player)
                    .availableSubtitles
                    .compactMap { RCTConvert.subtitleTrackJson($0) }
            }.runOnQueue(.main)
            AsyncFunction("setSubtitleTrack") { (owner: SharedPlayer, trackIdentifier: String?) in
                (try owner.player).setSubtitle(trackIdentifier: trackIdentifier)
            }.runOnQueue(.main)

            AsyncFunction("getVideoQuality") { (owner: SharedPlayer) -> [String: Any]? in
                RCTConvert.toJson(videoQuality: (try owner.player).videoQuality)
            }.runOnQueue(.main)
            AsyncFunction("getAvailableVideoQualities") { (owner: SharedPlayer) -> [[String: Any]] in
                (try owner.player)
                    .availableVideoQualities.compactMap { RCTConvert.toJson(videoQuality: $0) }
            }.runOnQueue(.main)
            AsyncFunction("getThumbnail") { (owner: SharedPlayer, time: Double) -> [String: Any]? in
                RCTConvert.toJson(thumbnail: (try owner.player).thumbnail(forTime: time))
            }.runOnQueue(.main)
            AsyncFunction("loadOfflineContent") { (owner: SharedPlayer, offline: SharedOfflineContentManager, options: [String: Any]?) -> Bool in // swiftlint:disable:this line_length
                #if os(iOS)
                guard let config = (try offline.offlineContentManager).createOfflineSourceConfig(
                    restrictedToAssetCache: options?["restrictedToAssetCache"] as? Bool ?? true
                ) else { return false }
                (try owner.player).load(sourceConfig: config)
                return true
                #else
                return false
                #endif
            }.runOnQueue(.main)
            AsyncFunction("scheduleAd") { (owner: SharedPlayer, adItemJson: [String: Any]) in
                guard let adItem = RCTConvert.adItem(adItemJson) else { return }
                (try owner.player).scheduleAd(adItem: adItem)
            }.runOnQueue(.main)
            AsyncFunction("isAirPlayActive") { (owner: SharedPlayer) -> Bool? in
                #if os(iOS)
                (try owner.player).isAirPlayActive
                #else
                false
                #endif
            }.runOnQueue(.main)
            AsyncFunction("isAirPlayAvailable") { (owner: SharedPlayer) -> Bool? in
                #if os(iOS)
                (try owner.player).allowsAirPlay
                #else
                false
                #endif
            }.runOnQueue(.main)
            AsyncFunction("showAirPlayTargetPicker") { (owner: SharedPlayer) in
                #if os(iOS)
                (try owner.player).showAirPlayTargetPicker()
                #endif
            }.runOnQueue(.main)
            AsyncFunction("isCastAvailable") { (owner: SharedPlayer) -> Bool? in
                (try owner.player).isCastAvailable
            }.runOnQueue(.main)
            AsyncFunction("isCasting") { (owner: SharedPlayer) -> Bool? in
                (try owner.player).isCasting
            }.runOnQueue(.main)
            AsyncFunction("castVideo") { (owner: SharedPlayer) in (try owner.player).castVideo() }.runOnQueue(.main)
            AsyncFunction("castStop") { (owner: SharedPlayer) in (try owner.player).castStop() }.runOnQueue(.main)
            AsyncFunction("skipAd") { (owner: SharedPlayer) in (try owner.player).skipAd() }.runOnQueue(.main)

            AsyncFunction("loadPlaylist") { (owner: SharedPlayer, sources: [SharedSource], options: [String: Any]?) in
                try sources.forEach { try ensureSourceAvailable($0.source, player: (try owner.player)) }
                let config = try playlistConfig(sources: sources, options: options)
                (try owner.player).load(playlistConfig: config)
            }.runOnQueue(.main)
            AsyncFunction("getSource") { (owner: SharedPlayer, known: [SharedSource]) -> SharedSource? in
                try owner.player.source.map { source in
                    known.first { $0.source === source } ?? SharedSource(source: source)
                }
            }.runOnQueue(.main)

            AsyncFunction("loadSource") { (owner: SharedPlayer, source: SharedSource) in
                try ensurePlaylistSourceType(source.source)
                try ensureSourceAvailable(source.source, player: (try owner.player))
                (try owner.player).load(source: source.source)
            }.runOnQueue(.main)
        }
        Class(SharedBufferApi.self) {
            Constructor { (owner: SharedPlayer) in SharedBufferApi(owner: owner) }
            AsyncFunction("getLevel") { (owner: SharedBufferApi, type: String) -> [String: Any]? in
                guard let bufferType = RCTConvert.bufferType(type) else { return nil }
                let player = (try owner.player)
                let level = player.buffer.getLevel(bufferType)
                return [
                    "audio": RCTConvert.toJson(bufferLevel: level, mediaType: "audio"),
                    "video": RCTConvert.toJson(bufferLevel: level, mediaType: "video")
                ]
            }.runOnQueue(.main)
            AsyncFunction("setTargetLevel") { (owner: SharedBufferApi, type: String, value: Double) in
                guard RCTConvert.bufferType(type) == .forwardDuration else { return }
                (try owner.player).buffer.setTargetLevel(value)
            }.runOnQueue(.main)
        }
        Class(SharedAnalyticsApi.self) {
            Constructor { (owner: SharedPlayer) in SharedAnalyticsApi(owner: owner) }
            AsyncFunction("sendCustomDataEvent") { (owner: SharedAnalyticsApi, json: [String: Any]) in
                guard let analytics = (try owner.player).analytics,
                      let customData = RCTConvert.analyticsCustomData(json) else { return }
                analytics.sendCustomDataEvent(customData: customData)
            }.runOnQueue(.main)
            AsyncFunction("getUserId") { (owner: SharedAnalyticsApi) -> String? in
                (try owner.player).analytics?.userId
            }.runOnQueue(.main)
        }
        Class(SharedMediaControlsApi.self) {
            Constructor { (owner: SharedPlayer) in SharedMediaControlsApi(owner: owner) }
            AsyncFunction("isEnabled") { (owner: SharedMediaControlsApi) -> Bool? in
                (try owner.player).nowPlaying.isEnabled
            }.runOnQueue(.main)
            AsyncFunction("setEnabled") { (owner: SharedMediaControlsApi, enabled: Bool) in
                (try owner.player).nowPlaying.isEnabled = enabled
            }.runOnQueue(.main)
        }
        Class(SharedPlaylistApi.self) {
            Constructor { (owner: SharedPlayer) in SharedPlaylistApi(owner: owner) }
            AsyncFunction("getSources") { (owner: SharedPlaylistApi, known: [SharedSource]) -> [SharedSource] in
                try owner.player.playlist.sources.map { source in
                    known.first { $0.source === source } ?? SharedSource(source: source)
                }
            }.runOnQueue(.main)
            AsyncFunction("add") { (owner: SharedPlaylistApi, source: SharedSource, index: Int?) in
                try ensurePlaylistSourceType(source.source)
                guard !source.source.isAttachedToPlayer else {
                    throw Exception(
                        name: "SourceAlreadyAttached", description: "Source is already attached to a player"
                    )
                }
                if let index {
                    (try owner.player).playlist.add(source: source.source, at: index)
                } else {
                    (try owner.player).playlist.add(source: source.source)
                }
            }.runOnQueue(.main)
            AsyncFunction("remove") { (owner: SharedPlaylistApi, source: SharedSource) in
                if let index = try owner.player.playlist.sources.firstIndex(where: {
                    $0 === source.source
                }) {
                    (try owner.player).playlist.remove(sourceAt: index)
                }
            }.runOnQueue(.main)
            AsyncFunction("removeAt") { (owner: SharedPlaylistApi, index: Int) in
                (try owner.player).playlist.remove(sourceAt: index)
            }.runOnQueue(.main)
            AsyncFunction("seek") { (owner: SharedPlaylistApi, source: SharedSource, time: Double) in
                (try owner.player).playlist.seek(source: source.source, time: time)
            }.runOnQueue(.main)
        }
    }
}

private func ensureSourceAvailable(_ source: Source, player: Player) throws {
    guard !source.isAttachedToPlayer || player.playlist.sources.contains(where: { $0 === source }) else {
        throw Exception(name: "SourceAlreadyAttached", description: "Source is attached to another player")
    }
}

private func playlistConfig(sources: [SharedSource], options: [String: Any]?) throws -> PlaylistConfig {
    guard !sources.isEmpty else {
        throw Exception(name: "InvalidPlaylist", description: "A playlist requires at least one source")
    }
    var seen = Set<ObjectIdentifier>()
    for source in sources {
        try ensurePlaylistSourceType(source.source)
        guard seen.insert(ObjectIdentifier(source.source)).inserted else {
            throw Exception(name: "DuplicatePlaylistSource", description: "A source is listed more than once")
        }
    }
    return PlaylistConfig(sources: sources.map { $0.source }, options: PlaylistOptions(
        preloadAllSources: options?["preloadAllSources"] as? Bool ?? false,
        replayMode: try RCTConvert.toReplayMode(options?["replayMode"])
    ))
}

// The SDK can fail fatally or unload the active session before rejecting unsupported sources.
private func ensurePlaylistSourceType(_ source: Source) throws {
    guard [.hls, .progressive, .movpkg].contains(source.sourceConfig.type) else {
        throw Exception(
            name: "UnsupportedPlaylistSource",
            description: "iOS playlists support only HLS, progressive and movpkg sources"
        )
    }
}
