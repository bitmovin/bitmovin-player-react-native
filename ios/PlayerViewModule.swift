import ExpoModulesCore

public class PlayerViewModule: Module {
    public func definition() -> ModuleDefinition {
        Name("PlayerViewModule")

        View(RNPlayerView.self) {
            Prop("scalingMode") { (view: RNPlayerView, scalingMode: String?) in
                view.setScalingMode(scalingMode: scalingMode)
            }
            Prop("isFullscreenRequested") { (view: RNPlayerView, isFullscreenRequested: Bool) in
                view.setFullscreenRequested(isFullscreen: isFullscreenRequested)
            }
            Prop("isPictureInPictureRequested") { (view: RNPlayerView, isPictureInPictureRequested: Bool) in
                view.setPictureInPicture(enterPictureInPicture: isPictureInPictureRequested)
            }
            // swiftlint:disable:next line_length
            AsyncFunction("attachBindings") { (view: RNPlayerView, owner: SharedPlayer, fullscreenId: String?, messagesId: String?, config: [String: Any]?) in
                try view.attachBindings(
                    owner: owner,
                    fullscreen: fullscreenId.flatMap {
                        self.appContext?.moduleRegistry.get(FullscreenHandlerModule.self)?.retrieve($0)
                    },
                    messages: messagesId.flatMap {
                        self.appContext?.moduleRegistry.get(CustomMessageHandlerModule.self)?.retrieve($0)
                    },
                    config: config
                )
            }
            AsyncFunction("updatePictureInPictureActions") { (view: RNPlayerView, actions: [String]) in
                view.updatePictureInPictureActions(actions: RCTConvert.pictureInPictureActions(actions))
            }
            AsyncFunction("setIsPictureInPictureEnabled") { (view: RNPlayerView, value: Bool) in
                view.setIsPictureInPictureEnabled(value)
            }
            Events(
                "onBmpViewAttached",
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
