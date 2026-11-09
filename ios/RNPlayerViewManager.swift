import ExpoModulesCore

public class RNPlayerViewManager: Module {
    public func definition() -> ModuleDefinition {
        Name("RNPlayerViewManager")

        View(RNPlayerView.self) {
            Prop("player") { (view: RNPlayerView, owner: SharedPlayer?) in
                view.setSharedPlayer(owner)
            }
            Prop("config") { (view: RNPlayerView, playerInfo: [String: Any]?) in
                view.configurePlayer(
                    playerViewConfig: RCTConvert.rnPlayerViewConfig(playerInfo?["playerViewConfig"] as? [String: Any])
                )
            }
            OnViewDidUpdateProps { (view: RNPlayerView) in
                view.attachConfiguredPlayer()
            }
            Prop("scalingMode") { (view: RNPlayerView, scalingMode: String?) in
                view.setScalingMode(scalingMode: scalingMode)
            }
            Prop("isFullscreenRequested") { (view: RNPlayerView, isFullscreenRequested: Bool) in
                view.setFullscreenRequested(isFullscreen: isFullscreenRequested)
            }
            Prop("isPictureInPictureRequested") { (view: RNPlayerView, isPictureInPictureRequested: Bool) in
                view.setPictureInPicture(enterPictureInPicture: isPictureInPictureRequested)
            }
            Prop("fullscreenHandler") { (view: RNPlayerView, handler: SharedFullscreen?) in
                view.setFullscreenHandler(handler)
            }
            Prop("customMessageHandler") { (view: RNPlayerView, handler: SharedCustomMessage?) in
                view.setCustomMessageHandler(handler)
            }
            AsyncFunction("updatePictureInPictureActions") { (view: RNPlayerView, actions: [String]) in
                view.updatePictureInPictureActions(actions: RCTConvert.pictureInPictureActions(actions))
            }
            AsyncFunction("setIsPictureInPictureEnabled") { (view: RNPlayerView, value: Bool) in
                view.setIsPictureInPictureEnabled(value)
            }
            Events(
                "onBmpPlayerViewReady",
                "onBmpPictureInPictureAvailabilityChanged",
                "onBmpPictureInPictureEnter",
                "onBmpPictureInPictureEntered",
                "onBmpPictureInPictureExit",
                "onBmpPictureInPictureExited",
                "onBmpFullscreenEnabled",
                "onBmpFullscreenDisabled",
                "onBmpFullscreenEnter",
                "onBmpFullscreenExit",
            )
        }
    }
}
