import BitmovinPlayer
import ExpoModulesCore

/// Shared handle used by migrated APIs while PlayerModule still controls creation and destruction.
public final class SharedPlayer: SharedObject {
    public let player: Player

    init(player: Player) {
        self.player = player
        super.init()
    }
}
