import Foundation

@objc public class RNPlayerView: UIView {
  /**
   React component's bubbling events. Note they'll be accessible as props.
   */
  @objc var onEvent: RCTBubblingEventBlock?
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

  /**
   Child bitmovin's player view set during configuration. Intendent to be used across components.
   */
  var playerView: PlayerView? {
    willSet {
      if let playerView = newValue {
        playerView.removeFromSuperview()
        playerView.frame = bounds
      }
    }
    didSet {
      guard let playerView = playerView else {
        return
      }
      addSubview(playerView)
    }
  }

  /**
   Handy property accessor for `playerView`'s player instance.
   */
  var player: Player? {
    get {
      return self.playerView?.player
    }
    set {
      self.playerView?.player = newValue
    }
  }

  /**
   Start listening and emitting player events as React events, .e.g. onPlay,
   onEvent, onReady etc.
   */
  func registerEvents() {
    self.player?.add(listener: self)
  }

  /**
   Stop listening and emitting React events.
   */
  func unregisterEvents() {
    self.player?.remove(listener: self)
  }
}
