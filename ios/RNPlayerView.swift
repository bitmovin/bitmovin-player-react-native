import Foundation

@objc public class RNPlayerView: UIView {
  /// List of bubbling events supported by the React component. Each event name listed here maps directly to a javascript prop.
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

  /// Reference to the shared `PlayerView` instance used by React components.
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

  /// Handy property accessor for `playerView`'s player.
  var player: Player? {
    get {
      return self.playerView?.player
    }
    set {
      self.playerView?.player = newValue
    }
  }

  /// Start listening to player events and emitting bubbled versions to js.
  func startBubblingEvents() {
    self.player?.add(listener: self)
  }

  /// Stop listening to player events and emitting bubbled versions to js.
  func stopBubblingEvents() {
    self.player?.remove(listener: self)
  }
}
