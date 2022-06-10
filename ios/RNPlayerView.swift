import Foundation

@objc public class RNPlayerView: UIView {
  @objc var onReady: RCTBubblingEventBlock?
  @objc var onPlay: RCTBubblingEventBlock?
  @objc var onEvent: RCTBubblingEventBlock?

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
