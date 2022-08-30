import BitmovinPlayer
import Foundation

@objc(RNPlayerViewManager)
class RNPlayerViewManager: RCTViewManager {
    /// Initialize module on main thread.
    override static func requiresMainQueueSetup() -> Bool {
        true
    }

    /// `UIView` factory function. It gets called for each `<NativePlayerView />` component
    /// from React.
    override func view() -> UIView! {
        RNPlayerView()
    }

    /**
     Sets the `Player` instance for the view with `viewId` inside RN's `UIManager` registry.
     - Parameter viewId: `RNPlayerView` id inside `UIManager`'s registry.
     - Parameter playerId: `Player` instance id inside `PlayerModule`'s registry.
     */
    @objc func attachPlayer(_ viewId: NSNumber, playerId: NativeId) {
        bridge.uiManager.addUIBlock { [weak self] _, views in
            guard
                let view = views?[viewId] as? RNPlayerView,
                let player = self?.getPlayerModule()?.retrieve(playerId)
            else {
                return
            }
            if let playerView = view.playerView {
                playerView.player = player
            } else {
                view.playerView = PlayerView(player: player, frame: view.bounds)
            }
            player.add(listener: view)
        }
    }

    /// Fetches the initialized `PlayerModule` instance on RN's bridge object.
    private func getPlayerModule() -> PlayerModule? {
        bridge.module(for: PlayerModule.self) as? PlayerModule
    }
}
