import BitmovinPlayer
import ExpoModulesCore
import Foundation

extension RCTConvert {
    /**
     * Converts the JS `PlaylistOptions` into native `PlaylistOptions`.
     * Throws for an unknown `replayMode`, like Android does.
     */
    static func playlistOptions(_ json: [String: Any]?) throws -> PlaylistOptions {
        let defaults = PlaylistOptions()
        guard let json else {
            return defaults
        }
        let replayMode = try (json["replayMode"] as? String).map(replayModeOrThrow) ?? defaults.replayMode
        return PlaylistOptions(
            preloadAllSources: json["preloadAllSources"] as? Bool ?? defaults.preloadAllSources,
            replayMode: replayMode
        )
    }

    private static func replayModeOrThrow(_ value: String) throws -> ReplayMode {
        switch value {
        case "playlist":
            return .playlist
        case "lastSource":
            return .lastSource
        default:
            throw Exception(name: "INVALID_REPLAY_MODE", description: "Unknown replay mode: \(value)")
        }
    }
}
