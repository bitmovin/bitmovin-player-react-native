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
        AsyncFunction("create") { (config: [String: Any]?, analytics: [String: Any]?, callback: JavaScriptValue?) -> SharedPlayer in // swiftlint:disable:this line_length
            try SharedPlayer.create(
                config: config,
                analyticsConfig: analytics,
                callback: callback.map { try CallbackScope(callback: $0, context: appContext) }
            )
        }.runOnQueue(.main)
        Class("Player", SharedPlayer.self) {
            AsyncFunction("play") { (owner: SharedPlayer) in owner.player.play() }.runOnQueue(.main)
            AsyncFunction("pause") { (owner: SharedPlayer) in owner.player.pause() }.runOnQueue(.main)
            AsyncFunction("mute") { (owner: SharedPlayer) in owner.player.mute() }.runOnQueue(.main)
            AsyncFunction("unmute") { (owner: SharedPlayer) in owner.player.unmute() }.runOnQueue(.main)
            AsyncFunction("seek") { (owner: SharedPlayer, time: Double) in
                owner.player.seek(time: time)
            }.runOnQueue(.main)
            AsyncFunction("timeShift") { (owner: SharedPlayer, offset: Double) in
                owner.player.timeShift = offset
            }.runOnQueue(.main)
            AsyncFunction("destroy") { (owner: SharedPlayer) in owner.destroy() }.runOnQueue(.main)
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
            AsyncFunction("getVolume") { (owner: SharedPlayer) -> Int? in owner.player.volume }.runOnQueue(.main)
            AsyncFunction("currentTime") { (owner: SharedPlayer, mode: String?) -> Double? in
                let player = owner.player
                if let mode {
                    return player.currentTime(RCTConvert.timeMode(mode))
                }
                return player.currentTime
            }.runOnQueue(.main)
            AsyncFunction("isPlaying") { (owner: SharedPlayer) -> Bool? in owner.player.isPlaying }.runOnQueue(.main)
            AsyncFunction("isPaused") { (owner: SharedPlayer) -> Bool? in owner.player.isPaused }.runOnQueue(.main)
            AsyncFunction("duration") { (owner: SharedPlayer) -> Double? in owner.player.duration }.runOnQueue(.main)
            AsyncFunction("isMuted") { (owner: SharedPlayer) -> Bool? in owner.player.isMuted }.runOnQueue(.main)
            AsyncFunction("getTimeShift") { (owner: SharedPlayer) -> Double? in
                owner.player.timeShift
            }.runOnQueue(.main)
            AsyncFunction("isLive") { (owner: SharedPlayer) -> Bool? in owner.player.isLive }.runOnQueue(.main)
            AsyncFunction("getMaxTimeShift") { (owner: SharedPlayer) -> Double? in
                owner.player.maxTimeShift
            }.runOnQueue(.main)
            AsyncFunction("getPlaybackSpeed") { (owner: SharedPlayer) -> Float? in
                owner.player.playbackSpeed
            }.runOnQueue(.main)
            AsyncFunction("isAd") { (owner: SharedPlayer) -> Bool? in owner.player.isAd }.runOnQueue(.main)
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
            AsyncFunction("loadOfflineContent") { (owner: SharedPlayer, offline: SharedOffline, options: [String: Any]?) -> Bool in // swiftlint:disable:this line_length
                #if os(iOS)
                guard let config = offline.offlineContentManager.createOfflineSourceConfig(
                    restrictedToAssetCache: options?["restrictedToAssetCache"] as? Bool ?? true
                ) else { return false }
                owner.player.load(sourceConfig: config)
                owner.source = nil
                return true
                #else
                return false
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
            AsyncFunction("isCasting") { (owner: SharedPlayer) -> Bool? in owner.player.isCasting }.runOnQueue(.main)
            AsyncFunction("castVideo") { (owner: SharedPlayer) in owner.player.castVideo() }.runOnQueue(.main)
            AsyncFunction("castStop") { (owner: SharedPlayer) in owner.player.castStop() }.runOnQueue(.main)
            AsyncFunction("skipAd") { (owner: SharedPlayer) in owner.player.skipAd() }.runOnQueue(.main)
            AsyncFunction("getBufferLevel") { (owner: SharedPlayer, type: String) -> [String: Any]? in
                guard let bufferType = RCTConvert.bufferType(type) else { return nil }
                let player = owner.player
                let level = player.buffer.getLevel(bufferType)
                return [
                    "audio": RCTConvert.toJson(bufferLevel: level, mediaType: "audio"),
                    "video": RCTConvert.toJson(bufferLevel: level, mediaType: "video")
                ]
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
            AsyncFunction("loadPlaylist") { (owner: SharedPlayer, sources: [SharedSource], options: [String: Any]?) in
                try sources.forEach { try ensureSourceAvailable($0.source, player: owner.player) }
                let config = try playlistConfig(sources: sources, options: options)
                owner.player.load(playlistConfig: config)
                owner.source = nil
            }.runOnQueue(.main)
            AsyncFunction("getSource") { (owner: SharedPlayer) -> SharedSource? in
                owner.player.source.map { SharedSource(source: $0, callback: nil, remote: nil) }
            }.runOnQueue(.main)
            AsyncFunction("getPlaylistSources") { (owner: SharedPlayer) -> [SharedSource] in
                owner.player.playlist.sources.map { SharedSource(source: $0, callback: nil, remote: nil) }
            }.runOnQueue(.main)
            AsyncFunction("playlistAdd") { (owner: SharedPlayer, source: SharedSource, index: Int?) in
                try ensureSourceAvailable(source.source, player: owner.player)
                if let index {
                    owner.player.playlist.add(source: source.source, at: index)
                } else {
                    owner.player.playlist.add(source: source.source)
                }
            }.runOnQueue(.main)
            AsyncFunction("playlistRemove") { (owner: SharedPlayer, source: SharedSource) in
                if let index = owner.player.playlist.sources.firstIndex(where: { $0 === source.source }) {
                    owner.player.playlist.remove(sourceAt: index)
                }
            }.runOnQueue(.main)
            AsyncFunction("playlistRemoveAt") { (owner: SharedPlayer, index: Int) in
                owner.player.playlist.remove(sourceAt: index)
            }.runOnQueue(.main)
            AsyncFunction("playlistSeek") { (owner: SharedPlayer, source: SharedSource, time: Double) in
                owner.player.playlist.seek(source: source.source, time: time)
            }.runOnQueue(.main)
            AsyncFunction("loadSource") { (owner: SharedPlayer, source: SharedSource) in
                owner.source = source
                owner.player.load(source: source.source)
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
    return PlaylistConfig(sources: sources.map(\.source), options: PlaylistOptions(
        preloadAllSources: options?["preloadAllSources"] as? Bool ?? false,
        replayMode: try RCTConvert.toReplayMode(options?["replayMode"])
    ))
}
