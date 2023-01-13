import BitmovinPlayer

@objc(RNPlayerView)
class RNPlayerView: UIView {
    /// React component events. Directly mapped to props in `NativePlayerView`.
    @objc var onEvent: RCTBubblingEventBlock?
    @objc var onPlayerActive: RCTBubblingEventBlock?
    @objc var onPlayerError: RCTBubblingEventBlock?
    @objc var onPlayerWarning: RCTBubblingEventBlock?
    @objc var onDestroy: RCTBubblingEventBlock?
    @objc var onMuted: RCTBubblingEventBlock?
    @objc var onUnmuted: RCTBubblingEventBlock?
    @objc var onReady: RCTBubblingEventBlock?
    @objc var onPaused: RCTBubblingEventBlock?
    @objc var onPlay: RCTBubblingEventBlock?
    @objc var onPlaying: RCTBubblingEventBlock?
    @objc var onPlaybackFinished: RCTBubblingEventBlock?
    @objc var onSeek: RCTBubblingEventBlock?
    @objc var onSeeked: RCTBubblingEventBlock?
    @objc var onStallStarted: RCTBubblingEventBlock?
    @objc var onStallEnded: RCTBubblingEventBlock?
    @objc var onTimeChanged: RCTBubblingEventBlock?
    @objc var onSourceLoad: RCTBubblingEventBlock?
    @objc var onSourceLoaded: RCTBubblingEventBlock?
    @objc var onSourceUnloaded: RCTBubblingEventBlock?
    @objc var onSourceError: RCTBubblingEventBlock?
    @objc var onSourceWarning: RCTBubblingEventBlock?
    @objc var onSubtitleAdded: RCTBubblingEventBlock?
    @objc var onSubtitleRemoved: RCTBubblingEventBlock?
    @objc var onSubtitleChanged: RCTBubblingEventBlock?
    @objc var onPictureInPictureEnter: RCTBubblingEventBlock?
    @objc var onPictureInPictureEntered: RCTBubblingEventBlock?
    @objc var onPictureInPictureExit: RCTBubblingEventBlock?
    @objc var onPictureInPictureExited: RCTBubblingEventBlock?
    @objc var onAdBreakFinished: RCTBubblingEventBlock?
    @objc var onAdBreakStarted: RCTBubblingEventBlock?
    @objc var onAdClicked: RCTBubblingEventBlock?
    @objc var onAdError: RCTBubblingEventBlock?
    @objc var onAdFinished: RCTBubblingEventBlock?
    @objc var onAdManifestLoad: RCTBubblingEventBlock?
    @objc var onAdManifestLoaded: RCTBubblingEventBlock?
    @objc var onAdQuartile: RCTBubblingEventBlock?
    @objc var onAdScheduled: RCTBubblingEventBlock?
    @objc var onAdSkipped: RCTBubblingEventBlock?
    @objc var onAdStarted: RCTBubblingEventBlock?
    @objc var onVideoPlaybackQualityChanged: RCTBubblingEventBlock?
    @objc var onFullscreenEnabled: RCTBubblingEventBlock?
    @objc var onFullscreenDisabled: RCTBubblingEventBlock?
    @objc var onFullscreenEnter: RCTBubblingEventBlock?
    @objc var onFullscreenExit: RCTBubblingEventBlock?

    /// The `PlayerView` subview.
    var playerView: PlayerView? {
        willSet {
            newValue?.autoresizingMask = [
                .flexibleWidth,
                .flexibleHeight
            ]
        }
        didSet {
            if let playerView = playerView {
                addSubview(playerView)
            }
        }
    }

    init() {
        super.init(frame: .zero)
    }

    required init?(coder: NSCoder) {
        super.init(coder: coder)
    }
}
