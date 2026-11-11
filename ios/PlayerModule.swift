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
        Class("Player", SharedPlayer.self) {
            Constructor { (config: [String: Any]?, analytics: [String: Any]?, callback: JavaScriptValue?) in
                try SharedPlayer.create(config: config, analyticsConfig: analytics,
                    callback: callback.map { try CallbackScope(callback: $0, context: appContext) })
            }
            AsyncFunction("initialize") { (owner: SharedPlayer) in try owner.initialize(); return () }.runOnQueue(.main)
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
                (try owner.player).maxSelectableBitrate = UInt(maxSelectableBitrate)
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
            AsyncFunction("isPlaying") { (owner: SharedPlayer) -> Bool? in (try owner.player).isPlaying }.runOnQueue(.main)
            AsyncFunction("isPaused") { (owner: SharedPlayer) -> Bool? in (try owner.player).isPaused }.runOnQueue(.main)
            AsyncFunction("getDuration") { (owner: SharedPlayer) -> Double? in (try owner.player).duration }.runOnQueue(.main)
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
            AsyncFunction("loadOfflineContent") { (owner: SharedPlayer, offline: SharedOffline, options: [String: Any]?) -> Bool in // swiftlint:disable:this line_length
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
            AsyncFunction("isCasting") { (owner: SharedPlayer) -> Bool? in (try owner.player).isCasting }.runOnQueue(.main)
            AsyncFunction("castVideo") { (owner: SharedPlayer) in (try owner.player).castVideo() }.runOnQueue(.main)
            AsyncFunction("castStop") { (owner: SharedPlayer) in (try owner.player).castStop() }.runOnQueue(.main)
            AsyncFunction("skipAd") { (owner: SharedPlayer) in (try owner.player).skipAd() }.runOnQueue(.main)

            AsyncFunction("loadPlaylist") { (owner: SharedPlayer, config: SharedPlaylistConfig) in
                let sources = config.sources
                let options = config.options
                try sources.forEach { try ensureSourceAvailable((try $0.source), player: (try owner.player)) }
                let config = try playlistConfig(sources: sources, options: options)
                (try owner.player).load(playlistConfig: config)
            }.runOnQueue(.main)
            AsyncFunction("getSource") { (owner: SharedPlayer, known: [SharedSource]) -> SharedSource? in
                try (try owner.player).source.map { source in
                    try known.first { (try $0.source) === source } ?? SharedSource(source: source, callback: nil)
                }
            }.runOnQueue(.main)

            AsyncFunction("loadSource") { (owner: SharedPlayer, source: SharedSource) in
                try ensurePlaylistSourceType((try source.source))
                try ensureSourceAvailable((try source.source), player: (try owner.player))
                (try owner.player).load(source: (try source.source))
            }.runOnQueue(.main)
        }
        Class("BufferApi", SharedBuffer.self) {
            Constructor { (owner: SharedPlayer) in SharedBuffer(owner: owner) }
            AsyncFunction("getLevel") { (owner: SharedBuffer, type: String) -> [String: Any]? in
                guard let bufferType = RCTConvert.bufferType(type) else { return nil }
                let player = (try owner.player)
                let level = player.buffer.getLevel(bufferType)
                return [
                    "audio": RCTConvert.toJson(bufferLevel: level, mediaType: "audio"),
                    "video": RCTConvert.toJson(bufferLevel: level, mediaType: "video")
                ]
            }.runOnQueue(.main)
            AsyncFunction("setTargetLevel") { (owner: SharedBuffer, type: String, value: Double) in
                guard RCTConvert.bufferType(type) == .forwardDuration else { return }
                (try owner.player).buffer.setTargetLevel(value)
            }.runOnQueue(.main)
        }
        Class("AnalyticsApi", SharedAnalytics.self) {
            Constructor { (owner: SharedPlayer) in SharedAnalytics(owner: owner) }
            AsyncFunction("sendCustomDataEvent") { (owner: SharedAnalytics, json: [String: Any]) in
                guard let analytics = (try owner.player).analytics,
                      let customData = RCTConvert.analyticsCustomData(json) else { return }
                analytics.sendCustomDataEvent(customData: customData)
            }.runOnQueue(.main)
            AsyncFunction("getUserId") { (owner: SharedAnalytics) -> String? in
                (try owner.player).analytics?.userId
            }.runOnQueue(.main)
        }
        Class("MediaControlsApi", SharedMediaControls.self) {
            Constructor { (owner: SharedPlayer) in SharedMediaControls(owner: owner) }
            AsyncFunction("isEnabled") { (owner: SharedMediaControls) -> Bool? in
                (try owner.player).nowPlaying.isEnabled
            }.runOnQueue(.main)
            AsyncFunction("setEnabled") { (owner: SharedMediaControls, enabled: Bool) in
                (try owner.player).nowPlaying.isEnabled = enabled
            }.runOnQueue(.main)
        }
        Class("PlaylistApi", SharedPlaylist.self) {
            Constructor { (owner: SharedPlayer) in SharedPlaylist(owner: owner) }
            AsyncFunction("getSources") { (owner: SharedPlaylist, known: [SharedSource]) -> [SharedSource] in
                try (try owner.player).playlist.sources.map { source in
                    try known.first { (try $0.source) === source } ?? SharedSource(source: source, callback: nil)
                }
            }.runOnQueue(.main)
            AsyncFunction("add") { (owner: SharedPlaylist, source: SharedSource, index: Int?) in
                try ensurePlaylistSourceType((try source.source))
                guard !(try source.source).isAttachedToPlayer else {
                    throw Exception(
                        name: "SourceAlreadyAttached", description: "Source is already attached to a player"
                    )
                }
                if let index {
                    (try owner.player).playlist.add(source: (try source.source), at: index)
                } else {
                    (try owner.player).playlist.add(source: (try source.source))
                }
            }.runOnQueue(.main)
            AsyncFunction("remove") { (owner: SharedPlaylist, source: SharedSource) in
                if let index = try (try owner.player).playlist.sources.firstIndex(where: { $0 === (try source.source) }) {
                    (try owner.player).playlist.remove(sourceAt: index)
                }
            }.runOnQueue(.main)
            AsyncFunction("removeAt") { (owner: SharedPlaylist, index: Int) in
                (try owner.player).playlist.remove(sourceAt: index)
            }.runOnQueue(.main)
            AsyncFunction("seek") { (owner: SharedPlaylist, source: SharedSource, time: Double) in
                (try owner.player).playlist.seek(source: (try source.source), time: time)
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
        try ensurePlaylistSourceType((try source.source))
        guard seen.insert(ObjectIdentifier((try source.source))).inserted else {
            throw Exception(name: "DuplicatePlaylistSource", description: "A source is listed more than once")
        }
    }
    return PlaylistConfig(sources: try sources.map { try $0.source }, options: PlaylistOptions(
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

private struct SharedPlaylistConfig: Record {
    @Field var sources: [SharedSource] = []
    @Field var options: [String: Any]?
}
