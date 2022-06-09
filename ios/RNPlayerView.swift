import Foundation

@objc public class RNPlayerView: UIView {
  @objc var onReady: RCTBubblingEventBlock?
  @objc var onPlay: RCTBubblingEventBlock?
  @objc var onEvent: RCTBubblingEventBlock?

  var playerView: PlayerView? {
    didSet {
      guard let playerView = playerView else {
        return
      }
      playerView.bounds = bounds
      addSubview(playerView)
    }
  }

  var player: Player? {
    get {
      return self.playerView?.player
    }
    set {
      self.playerView?.player = newValue
    }
  }

  /**
   Start listening and emitting player events back to the React layer.  (e.g. onPlay, onEvent, onReady etc.)
   */
  func registerEvents() {
    self.player?.add(listener: self)
  }

  /**
   Stop listening and emitting player events to React.
   */
  func unregisterEvents() {
    self.player?.remove(listener: self)
  }
}
