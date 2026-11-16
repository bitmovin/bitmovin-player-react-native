import BitmovinPlayer
import ExpoModulesCore

public class MediaControlsModule: Module {
    public func definition() -> ModuleDefinition {
        Name("MediaControlsModule")

        AsyncFunction("isEnabled") { (owner: SharedPlayer) -> Bool? in
            let player = try owner.player

            return player.nowPlaying.isEnabled
        }.runOnQueue(.main)

        AsyncFunction("setEnabled") { (owner: SharedPlayer, enabled: Bool) in
            let player = try owner.player

            player.nowPlaying.isEnabled = enabled
        }.runOnQueue(.main)
    }
}
