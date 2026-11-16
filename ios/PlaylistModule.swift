import BitmovinPlayer
import ExpoModulesCore

public class PlaylistModule: Module {
    public func definition() -> ModuleDefinition {
        Name("PlaylistModule")

        AsyncFunction("sources") { (owner: SharedPlayer, known: [SharedSource]) -> [SharedSource] in
            try owner.player.playlist.sources.map { source in
                known.first { $0.source === source } ?? SharedSource(source: source)
            }
        }.runOnQueue(.main)

        AsyncFunction("add") { (owner: SharedPlayer, peer: SharedSource, index: Int?) in
            let player = try owner.player
            let source = peer.source
            // `load(playlistConfig:)` rejects these sources, but `add` does not check the source type.
            guard [.hls, .progressive, .movpkg].contains(source.sourceConfig.type) else {
                throw Exception(name: "UnsupportedPlaylistSource", description: "Unsupported playlist source type")
            }
            // The SDK raises a `fatalError` for a source attached to another player and only logs a warning for a
            // source that is already part of this playlist.
            guard !source.isAttachedToPlayer else {
                throw Exception(
                    name: "SOURCE_ALREADY_ATTACHED",
                    description: "Source is already attached to a player"
                )
            }
            if let index {
                player.playlist.add(source: source, at: index)
            } else {
                player.playlist.add(source: source)
            }
        }.runOnQueue(.main)

        AsyncFunction("remove") { (owner: SharedPlayer, peer: SharedSource) -> Bool in
            let player = try owner.player
            let source = peer.source
            // The SDK can only remove sources by index.
            let index = player.playlist.sources.firstIndex { ($0 as AnyObject) === (source as AnyObject) }
            guard let index else { return false }
            player.playlist.remove(sourceAt: index)
            // The SDK keeps the active source and only logs a warning.
            return !Self.contains(player.playlist.sources, source)
        }.runOnQueue(.main)

        AsyncFunction("removeAt") { (owner: SharedPlayer, index: Int) in
            let player = try owner.player
            if player.playlist.sources.indices.contains(index) { player.playlist.remove(sourceAt: index) }
        }.runOnQueue(.main)

        AsyncFunction("seek") { (owner: SharedPlayer, peer: SharedSource, time: Double) in
            let player = try owner.player
            let source = peer.source
            player.playlist.seek(source: source, time: time)
        }.runOnQueue(.main)
    }

    private static func contains(_ sources: [Source], _ source: Source) -> Bool {
        sources.contains { ($0 as AnyObject) === (source as AnyObject) }
    }
}
