import BitmovinPlayer

@objc(RNPlayerView)
class RNPlayerView: UIView {
  /// Component events.
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
  @objc var onTimeChanged: RCTBubblingEventBlock?
  @objc var onSourceLoad: RCTBubblingEventBlock?
  @objc var onSourceLoaded: RCTBubblingEventBlock?
  @objc var onSourceUnloaded: RCTBubblingEventBlock?
  @objc var onSourceError: RCTBubblingEventBlock?
  @objc var onSourceWarning: RCTBubblingEventBlock?

  /// Bitmovin's player view.
  /// Get's initialized when there's a player instance ready to be used.
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
