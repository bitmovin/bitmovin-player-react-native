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
}
