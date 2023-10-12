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

    private var customMessageHandlerBridgeId: NativeId?

    /**
     Sets the `Player` instance for the view with `viewId` inside RN's `UIManager` registry.
     - Parameter viewId: `RNPlayerView` id inside `UIManager`'s registry.
     - Parameter playerId: `Player` instance id inside `PlayerModule`'s registry.
     */
    @objc func attachPlayer(_ viewId: NSNumber, playerId: NativeId, playerConfig: NSDictionary?) {
        bridge.uiManager.addUIBlock { [weak self] _, views in
            guard
                let self,
                let view = views?[viewId] as? RNPlayerView,
                let player = self.getPlayerModule()?.retrieve(playerId)
            else {
                return
            }
#if os(iOS)
            if let customMessageHandlerBridgeId = self.customMessageHandlerBridgeId,
               let customMessageHandlerBridge = self.bridge[CustomMessageHandlerModule.self]?.retrieve(customMessageHandlerBridgeId),
               player.config.styleConfig.userInterfaceType == .bitmovin {
                let bitmovinUserInterfaceConfig = player.config.styleConfig.userInterfaceConfig as? BitmovinUserInterfaceConfig ?? BitmovinUserInterfaceConfig()
                player.config.styleConfig.userInterfaceConfig = bitmovinUserInterfaceConfig
                bitmovinUserInterfaceConfig.customMessageHandler = customMessageHandlerBridge.customMessageHandler
            }
#endif

            if let playerView = view.playerView {
                playerView.player = player
            } else {
                let playerViewConfig = PlayerViewConfig()
                if let pictureInPictureConfig = RCTConvert.pictureInPictureConfig(view.pictureInPictureConfig) {
                    playerViewConfig.pictureInPictureConfig = pictureInPictureConfig
                }
                view.playerView = PlayerView(
                    player: player,
                    frame: view.bounds,
                    playerViewConfig: playerViewConfig
                )
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

    @objc func setCustomMessageHandlerBridgeId(_ viewId: NSNumber, customMessageHandlerBridgeId: NativeId) {
        self.customMessageHandlerBridgeId = customMessageHandlerBridgeId
    }

     @objc func setFullscreen(_ viewId: NSNumber, isFullscreen: Bool) {
         bridge.uiManager.addUIBlock { [weak self] _, views in
             guard
                 let self,
                 let view = views?[viewId] as? RNPlayerView
             else {
                 return
             }
             guard let playerView = view.playerView else {
                 return
             }
             guard playerView.isFullscreen != isFullscreen else {
                 return
             }
             if isFullscreen {
                 playerView.enterFullscreen()
             } else {
                 playerView.exitFullscreen()
             }
         }
     }

     @objc func setScalingMode(_ viewId: NSNumber, scalingMode: String) {
         bridge.uiManager.addUIBlock { [weak self] _, views in
             guard
                 let self,
                 let view = views?[viewId] as? RNPlayerView
             else {
                 return
             }
             guard let playerView = view.playerView else {
                 return
             }
             if scalingMode == "Zoom" {
                 playerView.scalingMode = ScalingMode.zoom
             } else if scalingMode == "Stretch" {
                 playerView.scalingMode = ScalingMode.stretch
             } else {
                 playerView.scalingMode = ScalingMode.fit
             }
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
