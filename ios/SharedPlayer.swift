import BitmovinPlayer
import ExpoModulesCore

/// Shared handle used by migrated APIs while PlayerModule still controls creation and destruction.
public final class SharedPlayer: SharedObject {
    public let player: Player
    private let sourceObserver = SharedObjectEvents()
    private let callback: CallbackScope?

    init(player: Player, callback: CallbackScope?) {
        self.player = player
        self.callback = callback
        super.init()
        player.add(listener: sourceObserver)
    }
    func closeCallbacks() { callback?.close() }
    deinit {
        closeCallbacks()
        let player = player
        let observer = sourceObserver
        DispatchQueue.main.async { player.remove(listener: observer) }
    }
    override public func sharedObjectWillRelease() { closeCallbacks() }
}
