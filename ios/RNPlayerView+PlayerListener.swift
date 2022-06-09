import Foundation
import BitmovinPlayer

extension RNPlayerView: PlayerListener {
  public func onReady(_ event: ReadyEvent, player: Player) {
    onReady?([
      "name": event.name,
      "timestamp": event.timestamp
    ])
  }

  public func onPlay(_ event: PlayEvent, player: Player) {
    onPlay?([
      "name": event.name,
      "time": event.time,
      "timestamp": event.timestamp
    ])
  }

  public func onEvent(_ event: Event, player: Player) {
    onEvent?([
      "name": event.name,
      "timestamp": event.timestamp
    ])
  }

  // TODO: Add more listeners, e.g. onPause, onSeek, onDestroy...
}
