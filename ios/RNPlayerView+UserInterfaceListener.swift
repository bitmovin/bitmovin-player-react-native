import BitmovinPlayer

extension RNPlayerView: UserInterfaceListener {
    public func onPictureInPictureEnter(_ event: PictureInPictureEnterEvent, view: PlayerView) {
        onBmpPictureInPictureEnter?(event.toJSON())
    }

    public func onPictureInPictureEntered(_ event: PictureInPictureEnteredEvent, view: PlayerView) {
        onBmpPictureInPictureEntered?(event.toJSON())
    }

    public func onPictureInPictureExit(_ event: PictureInPictureExitEvent, view: PlayerView) {
        onBmpPictureInPictureExit?(event.toJSON())
    }

    public func onPictureInPictureExited(_ event: PictureInPictureExitedEvent, view: PlayerView) {
        onBmpPictureInPictureExited?(event.toJSON())
    }

    public func onFullscreenEnter(_ event: FullscreenEnterEvent, view: PlayerView) {
        onBmpFullscreenEnter?(event.toJSON())
    }

    public func onFullscreenExit(_ event: FullscreenExitEvent, view: PlayerView) {
        onBmpFullscreenExit?(event.toJSON())
    }

    public func onFullscreenEnabled(_ event: FullscreenEnabledEvent, view: PlayerView) {
        onBmpFullscreenEnabled?(event.toJSON())
    }

    public func onFullscreenDisabled(_ event: FullscreenDisabledEvent, view: PlayerView) {
        onBmpFullscreenDisabled?(event.toJSON())
    }
}
