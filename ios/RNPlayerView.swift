import BitmovinPlayer

@objc(RNPlayerView)
public class RNPlayerView: UIView {
    /// React component events. Directly mapped to props in `NativePlayerView`.
    @objc var bmpOnEvent: RCTBubblingEventBlock?
    @objc var bmpOnPlayerActive: RCTBubblingEventBlock?
    @objc var bmpOnPlayerError: RCTBubblingEventBlock?
    @objc var bmpOnPlayerWarning: RCTBubblingEventBlock?
    @objc var bmpOnDestroy: RCTBubblingEventBlock?
    @objc var bmpOnMuted: RCTBubblingEventBlock?
    @objc var bmpOnUnmuted: RCTBubblingEventBlock?
    @objc var bmpOnReady: RCTBubblingEventBlock?
    @objc var bmpOnPaused: RCTBubblingEventBlock?
    @objc var bmpOnPlay: RCTBubblingEventBlock?
    @objc var bmpOnPlaying: RCTBubblingEventBlock?
    @objc var bmpOnPlaybackFinished: RCTBubblingEventBlock?
    @objc var bmpOnSeek: RCTBubblingEventBlock?
    @objc var bmpOnSeeked: RCTBubblingEventBlock?
    @objc var bmpOnTimeShift: RCTBubblingEventBlock?
    @objc var bmpOnTimeShifted: RCTBubblingEventBlock?
    @objc var bmpOnStallStarted: RCTBubblingEventBlock?
    @objc var bmpOnStallEnded: RCTBubblingEventBlock?
    @objc var bmpOnTimeChanged: RCTBubblingEventBlock?
    @objc var bmpOnSourceLoad: RCTBubblingEventBlock?
    @objc var bmpOnSourceLoaded: RCTBubblingEventBlock?
    @objc var bmpOnSourceUnloaded: RCTBubblingEventBlock?
    @objc var bmpOnSourceError: RCTBubblingEventBlock?
    @objc var bmpOnSourceWarning: RCTBubblingEventBlock?
    @objc var bmpOnAudioAdded: RCTBubblingEventBlock?
    @objc var bmpOnAudioRemoved: RCTBubblingEventBlock?
    @objc var bmpOnAudioChanged: RCTBubblingEventBlock?
    @objc var bmpOnSubtitleAdded: RCTBubblingEventBlock?
    @objc var bmpOnSubtitleRemoved: RCTBubblingEventBlock?
    @objc var bmpOnSubtitleChanged: RCTBubblingEventBlock?
    @objc var bmpOnDownloadFinished: RCTBubblingEventBlock?
    @objc var bmpOnPictureInPictureEnter: RCTBubblingEventBlock?
    @objc var bmpOnPictureInPictureEntered: RCTBubblingEventBlock?
    @objc var bmpOnPictureInPictureExit: RCTBubblingEventBlock?
    @objc var bmpOnPictureInPictureExited: RCTBubblingEventBlock?
    @objc var bmpOnAdBreakFinished: RCTBubblingEventBlock?
    @objc var bmpOnAdBreakStarted: RCTBubblingEventBlock?
    @objc var bmpOnAdClicked: RCTBubblingEventBlock?
    @objc var bmpOnAdError: RCTBubblingEventBlock?
    @objc var bmpOnAdFinished: RCTBubblingEventBlock?
    @objc var bmpOnAdManifestLoad: RCTBubblingEventBlock?
    @objc var bmpOnAdManifestLoaded: RCTBubblingEventBlock?
    @objc var bmpOnAdQuartile: RCTBubblingEventBlock?
    @objc var bmpOnAdScheduled: RCTBubblingEventBlock?
    @objc var bmpOnAdSkipped: RCTBubblingEventBlock?
    @objc var bmpOnAdStarted: RCTBubblingEventBlock?
    @objc var bmpOnVideoDownloadQualityChanged: RCTBubblingEventBlock?
    @objc var bmpOnVideoPlaybackQualityChanged: RCTBubblingEventBlock?
    @objc var bmpOnFullscreenEnabled: RCTBubblingEventBlock?
    @objc var bmpOnFullscreenDisabled: RCTBubblingEventBlock?
    @objc var bmpOnFullscreenEnter: RCTBubblingEventBlock?
    @objc var bmpOnFullscreenExit: RCTBubblingEventBlock?
    @objc var bmpOnCastAvailable: RCTBubblingEventBlock?
    @objc var bmpOnCastPaused: RCTBubblingEventBlock?
    @objc var bmpOnCastPlaybackFinished: RCTBubblingEventBlock?
    @objc var bmpOnCastPlaying: RCTBubblingEventBlock?
    @objc var bmpOnCastStarted: RCTBubblingEventBlock?
    @objc var bmpOnCastStart: RCTBubblingEventBlock?
    @objc var bmpOnCastStopped: RCTBubblingEventBlock?
    @objc var bmpOnCastTimeUpdated: RCTBubblingEventBlock?
    @objc var bmpOnCastWaitingForDevice: RCTBubblingEventBlock?
    @objc var bmpOnPictureInPictureAvailabilityChanged: RCTBubblingEventBlock?
    @objc var bmpOnPlaybackSpeedChanged: RCTBubblingEventBlock?
    @objc var bmpOnCueEnter: RCTBubblingEventBlock?
    @objc var bmpOnCueExit: RCTBubblingEventBlock?
    @objc var config: [String: Any]?

    /// The `PlayerView` subview.
    var playerView: PlayerView? {
        willSet {
            newValue?.autoresizingMask = [
                .flexibleWidth,
                .flexibleHeight
            ]
        }
        didSet {
            if let playerView {
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
