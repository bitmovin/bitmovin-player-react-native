import BitmovinPlayer

extension RNPlayerView: UserInterfaceListener {
    public func onPictureInPictureEnter(_ event: PictureInPictureEnterEvent, view: PlayerView) {
        bmpOnPictureInPictureEnter?(event.toJSON())
    }

    public func onPictureInPictureEntered(_ event: PictureInPictureEnteredEvent, view: PlayerView) {
        bmpOnPictureInPictureEntered?(event.toJSON())
    }

    public func onPictureInPictureExit(_ event: PictureInPictureExitEvent, view: PlayerView) {
        bmpOnPictureInPictureExit?(event.toJSON())
    }

    public func onPictureInPictureExited(_ event: PictureInPictureExitedEvent, view: PlayerView) {
        bmpOnPictureInPictureExited?(event.toJSON())
    }

    public func onFullscreenEnter(_ event: FullscreenEnterEvent, view: PlayerView) {
        bmpOnFullscreenEnter?(event.toJSON())
    }

    public func onFullscreenExit(_ event: FullscreenExitEvent, view: PlayerView) {
        bmpOnFullscreenExit?(event.toJSON())
    }

    public func onFullscreenEnabled(_ event: FullscreenEnabledEvent, view: PlayerView) {
        bmpOnFullscreenEnabled?(event.toJSON())
    }

    public func onFullscreenDisabled(_ event: FullscreenDisabledEvent, view: PlayerView) {
        bmpOnFullscreenDisabled?(event.toJSON())
    }
}
