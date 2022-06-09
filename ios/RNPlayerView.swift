import Foundation

@objc public class RNPlayerView: RNBasePlayerView {
  @objc var onReady: RCTBubblingEventBlock?
  @objc var onPlay: RCTBubblingEventBlock?
  @objc var onEvent: RCTBubblingEventBlock?

  func addPlayerListener() {
    self.player?.add(listener: self)
  }

  func removePlayerListener() {
    self.player?.remove(listener: self)
  }
}

extension RNPlayerView: PlayerListener {
  public func onReady(_ event: ReadyEvent, player: Player) {
    if let onReady = self.onReady {
      onReady([
        "name": event.name,
        "timestamp": event.timestamp
      ])
    }
  }

  public func onPlay(_ event: PlayEvent, player: Player) {
    if let onPlay = self.onPlay {
      onPlay([
        "name": event.name,
        "time": event.time,
        "timestamp": event.timestamp
      ])
    }
  }

  public func onEvent(_ event: Event, player: Player) {
    if let onEvent = self.onEvent {
      onEvent([
        "name": event.name,
        "timestamp": event.timestamp
      ])
    }
  }
}
