import BitmovinPlayer

@objc(RNPlayerViewManager)
class RNPlayerViewManager: RCTViewManager {
    /// Register module to be initialized on the main thread.
    override class func requiresMainQueueSetup() -> Bool {
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
    @objc func attachPlayer(_ viewId: NSNumber, playerId: String) {
        self.bridge.uiManager.addUIBlock { [weak self] _, views in
            guard
                let view = views?[viewId] as? RNPlayerView,
                let playerModule = self?.getPlayerModule(),
                let context = playerModule.playerContext(with: playerId)
            else {
                return
            }
            if view.playerView == nil {
                view.playerView = PlayerView(player: context.player, frame: view.bounds)
                context.player.add(listener: view)
                context.loadPendingSource()
            }
        }
    }

    /// Fetches the initialized `PlayerModule` instance on RN's bridge object.
    private func getPlayerModule() -> PlayerModule? {
        bridge.module(for: PlayerModule.self) as? PlayerModule
    }
}
