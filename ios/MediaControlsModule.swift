import BitmovinPlayer
import ExpoModulesCore

public class MediaControlsModule: Module {
    public func definition() -> ModuleDefinition {
        Name("MediaControlsModule")

        AsyncFunction("isEnabled") { (playerId: String) -> Bool? in
            guard let playerModule = appContext?.moduleRegistry.get(PlayerModule.self),
                  let player = playerModule.retrieve(playerId) else {
                return nil
            }

            return player.nowPlaying.isEnabled
        }.runOnQueue(.main)

        AsyncFunction("setEnabled") { (playerId: String, enabled: Bool) in
            guard let playerModule = appContext?.moduleRegistry.get(PlayerModule.self),
                  let player = playerModule.retrieve(playerId) else {
                return
            }

            player.nowPlaying.isEnabled = enabled
        }.runOnQueue(.main)
    }
}
