import BitmovinPlayer

extension RNPlayerView: UserInterfaceListener {
    public func onPictureInPictureEnter(_ event: PictureInPictureEnterEvent, view: PlayerView) {
        onPictureInPictureEnter?(event.toJSON())
    }

    public func onPictureInPictureEntered(_ event: PictureInPictureEnteredEvent, view: PlayerView) {
        onPictureInPictureEntered?(event.toJSON())
    }

    public func onPictureInPictureExit(_ event: PictureInPictureExitEvent, view: PlayerView) {
        onPictureInPictureExit?(event.toJSON())
    }

    public func onPictureInPictureExited(_ event: PictureInPictureExitedEvent, view: PlayerView) {
        onPictureInPictureExited?(event.toJSON())
    }

    public func onFullscreenEnter(_ event: FullscreenEnterEvent, view: PlayerView) {
        onFullscreenEnter?(event.toJSON())
    }

    public func onFullscreenExit(_ event: FullscreenExitEvent, view: PlayerView) {
        onFullscreenExit?(event.toJSON())
    }

    public func onFullscreenEnabled(_ event: FullscreenEnabledEvent, view: PlayerView) {
        onFullscreenEnabled?(event.toJSON())
    }

    public func onFullscreenDisabled(_ event: FullscreenDisabledEvent, view: PlayerView) {
        onFullscreenDisabled?(event.toJSON())
    }
}
