import BitmovinPlayer
import ExpoModulesCore

/// Shared handle used by migrated APIs while PlayerModule still controls creation and destruction.
public final class SharedPlayer: SharedObject {
    public let player: Player
    private let callback: CallbackScope?

    init(player: Player, callback: CallbackScope?) {
        self.player = player
        self.callback = callback
        super.init()
    }
    func closeCallbacks() { callback?.close() }
    deinit { closeCallbacks() }
    override public func sharedObjectWillRelease() { closeCallbacks() }
}
