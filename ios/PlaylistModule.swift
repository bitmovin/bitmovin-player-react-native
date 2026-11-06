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

        AsyncFunction("add") { [weak self] (nativeId: NativeId, sourceNativeId: NativeId, index: Int?) in
            guard let player = PlayerRegistry.getPlayer(nativeId: nativeId) else { return }
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
        }.runOnQueue(.main)

        AsyncFunction("remove") { [weak self] (nativeId: NativeId, sourceNativeId: NativeId) in
            guard let player = PlayerRegistry.getPlayer(nativeId: nativeId),
                  let source = self?.retrieveSource(sourceNativeId) else { return }
            // The SDK can only remove sources by index.
            let index = player.playlist.sources.firstIndex { ($0 as AnyObject) === (source as AnyObject) }
            guard let index else { return }
            player.playlist.remove(sourceAt: index)
        }.runOnQueue(.main)

        AsyncFunction("removeAt") { (nativeId: NativeId, index: Int) in
            PlayerRegistry.getPlayer(nativeId: nativeId)?.playlist.remove(sourceAt: index)
        }.runOnQueue(.main)

        AsyncFunction("seek") { [weak self] (nativeId: NativeId, sourceNativeId: NativeId, time: Double) in
            guard let player = PlayerRegistry.getPlayer(nativeId: nativeId),
                  let source = self?.retrieveSource(sourceNativeId) else { return }
            player.playlist.seek(source: source, time: time)
        }.runOnQueue(.main)
    }

    private func retrieveSource(_ nativeId: NativeId) -> Source? {
        appContext?.moduleRegistry.get(SourceModule.self)?.retrieve(nativeId)
    }
}
