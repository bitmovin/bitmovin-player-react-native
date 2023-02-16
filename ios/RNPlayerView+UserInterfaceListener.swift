import BitmovinPlayer

extension RNPlayerView: UserInterfaceListener {
    func onPictureInPictureEnter(_ event: PictureInPictureEnterEvent, view: PlayerView) {
        onPictureInPictureEnter?(event.toJSON())
    }

    func onPictureInPictureEntered(_ event: PictureInPictureEnteredEvent, view: PlayerView) {
        onPictureInPictureEntered?(event.toJSON())
    }

    func onPictureInPictureExit(_ event: PictureInPictureExitEvent, view: PlayerView) {
        onPictureInPictureExit?(event.toJSON())
    }

    func onPictureInPictureExited(_ event: PictureInPictureExitedEvent, view: PlayerView) {
        onPictureInPictureExited?(event.toJSON())
    }

    func onFullscreenEnter(_ event: FullscreenEnterEvent, view: PlayerView) {
        onFullscreenEnter?(event.toJSON())
    }

    func onFullscreenExit(_ event: FullscreenExitEvent, view: PlayerView) {
        onFullscreenExit?(event.toJSON())
    }

    func onFullscreenEnabled(_ event: FullscreenEnabledEvent, view: PlayerView) {
        onFullscreenEnabled?(event.toJSON())
    }

    func onFullscreenDisabled(_ event: FullscreenDisabledEvent, view: PlayerView) {
        onFullscreenDisabled?(event.toJSON())
    }
}
