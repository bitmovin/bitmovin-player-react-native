import BitmovinPlayer
import Combine

@objc(RNPlayerView)
public class RNPlayerView: UIView {
    /// React component events. Directly mapped to props in `NativePlayerView`.
    @objc var onBmpEvent: RCTBubblingEventBlock?
    @objc var onBmpPlayerActive: RCTBubblingEventBlock?
    @objc var onBmpPlayerError: RCTBubblingEventBlock?
    @objc var onBmpPlayerWarning: RCTBubblingEventBlock?
    @objc var onBmpDestroy: RCTBubblingEventBlock?
    @objc var onBmpMuted: RCTBubblingEventBlock?
    @objc var onBmpUnmuted: RCTBubblingEventBlock?
    @objc var onBmpReady: RCTBubblingEventBlock?
    @objc var onBmpPaused: RCTBubblingEventBlock?
    @objc var onBmpPlay: RCTBubblingEventBlock?
    @objc var onBmpPlaying: RCTBubblingEventBlock?
    @objc var onBmpPlaybackFinished: RCTBubblingEventBlock?
    @objc var onBmpSeek: RCTBubblingEventBlock?
    @objc var onBmpSeeked: RCTBubblingEventBlock?
    @objc var onBmpTimeShift: RCTBubblingEventBlock?
    @objc var onBmpTimeShifted: RCTBubblingEventBlock?
    @objc var onBmpStallStarted: RCTBubblingEventBlock?
    @objc var onBmpStallEnded: RCTBubblingEventBlock?
    @objc var onBmpTimeChanged: RCTBubblingEventBlock?
    @objc var onBmpSourceLoad: RCTBubblingEventBlock?
    @objc var onBmpSourceLoaded: RCTBubblingEventBlock?
    @objc var onBmpSourceUnloaded: RCTBubblingEventBlock?
    @objc var onBmpSourceError: RCTBubblingEventBlock?
    @objc var onBmpSourceWarning: RCTBubblingEventBlock?
    @objc var onBmpAudioAdded: RCTBubblingEventBlock?
    @objc var onBmpAudioRemoved: RCTBubblingEventBlock?
    @objc var onBmpAudioChanged: RCTBubblingEventBlock?
    @objc var onBmpSubtitleAdded: RCTBubblingEventBlock?
    @objc var onBmpSubtitleRemoved: RCTBubblingEventBlock?
    @objc var onBmpSubtitleChanged: RCTBubblingEventBlock?
    @objc var onBmpDownloadFinished: RCTBubblingEventBlock?
    @objc var onBmpPictureInPictureEnter: RCTBubblingEventBlock?
    @objc var onBmpPictureInPictureEntered: RCTBubblingEventBlock?
    @objc var onBmpPictureInPictureExit: RCTBubblingEventBlock?
    @objc var onBmpPictureInPictureExited: RCTBubblingEventBlock?
    @objc var onBmpAdBreakFinished: RCTBubblingEventBlock?
    @objc var onBmpAdBreakStarted: RCTBubblingEventBlock?
    @objc var onBmpAdClicked: RCTBubblingEventBlock?
    @objc var onBmpAdError: RCTBubblingEventBlock?
    @objc var onBmpAdFinished: RCTBubblingEventBlock?
    @objc var onBmpAdManifestLoad: RCTBubblingEventBlock?
    @objc var onBmpAdManifestLoaded: RCTBubblingEventBlock?
    @objc var onBmpAdQuartile: RCTBubblingEventBlock?
    @objc var onBmpAdScheduled: RCTBubblingEventBlock?
    @objc var onBmpAdSkipped: RCTBubblingEventBlock?
    @objc var onBmpAdStarted: RCTBubblingEventBlock?
    @objc var onBmpVideoDownloadQualityChanged: RCTBubblingEventBlock?
    @objc var onBmpVideoPlaybackQualityChanged: RCTBubblingEventBlock?
    @objc var onBmpFullscreenEnabled: RCTBubblingEventBlock?
    @objc var onBmpFullscreenDisabled: RCTBubblingEventBlock?
    @objc var onBmpFullscreenEnter: RCTBubblingEventBlock?
    @objc var onBmpFullscreenExit: RCTBubblingEventBlock?
    @objc var onBmpCastAvailable: RCTBubblingEventBlock?
    @objc var onBmpCastPaused: RCTBubblingEventBlock?
    @objc var onBmpCastPlaybackFinished: RCTBubblingEventBlock?
    @objc var onBmpCastPlaying: RCTBubblingEventBlock?
    @objc var onBmpCastStarted: RCTBubblingEventBlock?
    @objc var onBmpCastStart: RCTBubblingEventBlock?
    @objc var onBmpCastStopped: RCTBubblingEventBlock?
    @objc var onBmpCastTimeUpdated: RCTBubblingEventBlock?
    @objc var onBmpCastWaitingForDevice: RCTBubblingEventBlock?
    @objc var onBmpPictureInPictureAvailabilityChanged: RCTBubblingEventBlock?
    @objc var onBmpPlaybackSpeedChanged: RCTBubblingEventBlock?
    @objc var onBmpCueEnter: RCTBubblingEventBlock?
    @objc var onBmpCueExit: RCTBubblingEventBlock?
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

    private let onWindowChangedSubject = PassthroughSubject<UIWindow?, Never>()
    var onWindowChanged: AnyPublisher<UIWindow?, Never> {
        onWindowChangedSubject
            .eraseToAnyPublisher()
    }

    init() {
        super.init(frame: .zero)
    }

    required init?(coder: NSCoder) {
        super.init(coder: coder)
    }

    override public func didMoveToWindow() {
        super.didMoveToWindow()
        onWindowChangedSubject.send(window)
    }
}
