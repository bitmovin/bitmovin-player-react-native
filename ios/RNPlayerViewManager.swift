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
    @objc func attachPlayer(_ viewId: NSNumber, playerId: NativeId, playerConfig: NSDictionary?) {
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
            view.playerView?.add(listener: view)
        }
    }

    @objc func attachFullscreenBridge(_ viewId: NSNumber, fullscreenBridgeId: NativeId) {
        bridge.uiManager.addUIBlock { [weak self] _, views in
            guard
                let view = views?[viewId] as? RNPlayerView,
                let fullscreenBridge = self?.getFullscreenHandlerModule()?.retrieve(fullscreenBridgeId)
            else {
                return
            }
            guard let playerView = view.playerView else {
                return
            }

            playerView.fullscreenHandler = fullscreenBridge
        }
    }

    @objc func attachCustomMessageHandlerBridge(_ viewId: NSNumber, playerId: NativeId, customMessageHandlerBridgeId: NativeId) {
        bridge.uiManager.addUIBlock { [weak self] _, views in
            guard
                let player = self?.getPlayerModule()?.retrieve(playerId),
                let customMessageHandlerBridge = self?.bridge[CustomMessageHandlerModule.self]?.retrieve(customMessageHandlerBridgeId)
            else {
                return
            }

            guard player.config.styleConfig.userInterfaceType == .bitmovin else {
                return
            }

            let bitmovinUserInterfaceConfig = player.config.styleConfig.userInterfaceConfig as? BitmovinUserInterfaceConfig ?? BitmovinUserInterfaceConfig()
            player.config.styleConfig.userInterfaceConfig = bitmovinUserInterfaceConfig

            bitmovinUserInterfaceConfig.customMessageHandler = customMessageHandlerBridge.customMessageHandler
        }
    }

    /// Fetches the initialized `PlayerModule` instance on RN's bridge object.
    private func getPlayerModule() -> PlayerModule? {
        bridge.module(for: PlayerModule.self) as? PlayerModule
    }

    /// Fetches the initialized `FullscreenHandlerModule` instance on RN's bridge object.
    private func getFullscreenHandlerModule() -> FullscreenHandlerModule? {
        bridge.module(for: FullscreenHandlerModule.self) as? FullscreenHandlerModule
    }
}
