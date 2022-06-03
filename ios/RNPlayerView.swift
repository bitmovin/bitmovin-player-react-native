import Foundation

@objc public class RNPlayerView: RNBasePlayerView {
  @objc var onReady: RCTBubblingEventBlock?
  @objc var onPlay: RCTBubblingEventBlock?
  @objc var onEvent: RCTBubblingEventBlock?

  private var isListening = false
  func addPlayerListener() {
    if !isListening {
      self.player?.add(listener: self)
      isListening = true
    }
  }

  func removePlayerListener() {
    if isListening {
      self.player?.remove(listener: self)
      isListening = false
    }
  }

  // Date helper
  lazy var isoDateFormatter = ISO8601DateFormatter()
  func dateString(from timestamp: TimeInterval) -> String {
    return isoDateFormatter.string(from: Date(timeIntervalSince1970: timestamp))
  }
}

extension RNPlayerView: PlayerListener {
  public func onReady(_ event: ReadyEvent, player: Player) {
    if let onReady = self.onReady, isListening {
      onReady([
        "name": event.name,
        "timestamp": dateString(from: event.timestamp)
      ])
    }
  }

  public func onPlay(_ event: PlayEvent, player: Player) {
    if let onPlay = self.onPlay, isListening {
      onPlay([
        "name": event.name,
        "time": event.time,
        "timestamp": dateString(from: event.timestamp)
      ])
    }
  }

  public func onEvent(_ event: Event, player: Player) {
    if let onEvent = self.onEvent, isListening {
      onEvent([
        "name": event.name,
        "timestamp": dateString(from: event.timestamp)
      ])
    }
  }
}
