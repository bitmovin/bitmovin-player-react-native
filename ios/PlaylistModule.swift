import BitmovinPlayer
import ExpoModulesCore

public class PlaylistModule: Module {
    public func definition() -> ModuleDefinition {
        Name("PlaylistModule")

        AsyncFunction("sources") { (nativeId: NativeId) -> [NativeId] in
            // A destroyed player has no playback session, for which native returns no sources.
            guard let player = PlayerRegistry.getPlayer(nativeId: nativeId) else { return [] }
            return player.playlist.sources.compactMap { SourceRegistry.nativeId(of: $0) }
        }.runOnQueue(.main)

        AsyncFunction("add") { [weak self] (nativeId: NativeId, sourceNativeId: NativeId, index: Int?) -> Bool in
            guard let player = PlayerRegistry.getPlayer(nativeId: nativeId) else { return false }
            guard let source = self?.retrieveSource(sourceNativeId) else {
                throw Exception(
                    name: "SOURCE_NOT_INITIALIZED",
                    description: "Source \(sourceNativeId) is not initialized"
                )
            }
            // `load(playlistConfig:)` rejects these sources, but `add` does not check the source type.
            try PlayerModule.validatePlaylistSourceType(source, sourceNativeId: sourceNativeId)
            // The SDK raises a `fatalError` for a source attached to another player and only logs a warning for a
            // source that is already part of this playlist.
            guard !source.isAttachedToPlayer else {
                throw Exception(
                    name: "SOURCE_ALREADY_ATTACHED",
                    description: "Source \(sourceNativeId) is already attached to a player"
                )
            }
            if let index {
                player.playlist.add(source: source, at: index)
            } else {
                player.playlist.add(source: source)
            }
            // The SDK ignores the source without an active playback session or with an invalid index.
            return Self.contains(player.playlist, source)
        }.runOnQueue(.main)

        AsyncFunction("remove") { [weak self] (nativeId: NativeId, sourceNativeId: NativeId) -> NativeId? in
            guard let player = PlayerRegistry.getPlayer(nativeId: nativeId),
                  let source = self?.retrieveSource(sourceNativeId) else { return nil }
            // The SDK can only remove sources by index.
            let index = player.playlist.sources.firstIndex { ($0 as AnyObject) === (source as AnyObject) }
            guard let index else { return nil }
            player.playlist.remove(sourceAt: index)
            return Self.removedNativeId(of: source, from: player.playlist)
        }.runOnQueue(.main)

        AsyncFunction("removeAt") { (nativeId: NativeId, index: Int) -> NativeId? in
            guard let player = PlayerRegistry.getPlayer(nativeId: nativeId),
                  player.playlist.sources.indices.contains(index) else { return nil }
            let source = player.playlist.sources[index]
            player.playlist.remove(sourceAt: index)
            return Self.removedNativeId(of: source, from: player.playlist)
        }.runOnQueue(.main)

        AsyncFunction("seek") { [weak self] (nativeId: NativeId, sourceNativeId: NativeId, time: Double) in
            guard let player = PlayerRegistry.getPlayer(nativeId: nativeId),
                  let source = self?.retrieveSource(sourceNativeId) else { return }
            player.playlist.seek(source: source, time: time)
        }.runOnQueue(.main)

        AsyncFunction("seekTo") { (_: NativeId, _: NativeId, _: [String: Any]?) in
            // The iOS SDK cannot seek to a seek target.
            throw Exception(name: "NOT_SUPPORTED", description: "PlaylistApi.seekTo is not supported on iOS")
        }.runOnQueue(.main)
    }

    private func retrieveSource(_ nativeId: NativeId) -> Source? {
        appContext?.moduleRegistry.get(SourceModule.self)?.retrieve(nativeId)
    }

    private static func contains(_ playlist: PlaylistApi, _ source: Source) -> Bool {
        playlist.sources.contains { ($0 as AnyObject) === (source as AnyObject) }
    }

    /**
     * The `nativeId` of `source` if it was removed from `playlist`, e.g. not if it is the active source, which the SDK
     * does not remove.
     */
    private static func removedNativeId(of source: Source, from playlist: PlaylistApi) -> NativeId? {
        contains(playlist, source) ? nil : SourceRegistry.nativeId(of: source)
    }
}
