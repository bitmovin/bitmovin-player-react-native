import Foundation
import BitmovinPlayer

@objc(RNPlayerViewManager)
public class RNPlayerViewManager: RCTViewManager {
  /**
   Enable module initialization on the main thread.
   */
  public override class func requiresMainQueueSetup() -> Bool { true }

  /**
   `UIView` factory for instances of the `NativePlayerView` component.
   */
  override public func view() -> UIView! {
    RNPlayerView(frame: .zero)
  }

  /**
   Create or reset the shared native `PlayerView` configuration used by components and start emitting bubbling events.
   - Parameter reactTag: Native view id.
   - Parameter options: Player configuration options sent from js.
   */
  @objc(create:options:)
  public func create(_ reactTag: NSNumber, options: Any?) {
    self.view(for: reactTag) { [weak self] view in
      guard let playerConfig = RCTConvert.bmpPlayerConfig(options) else {
        Logging.error("[NativePlayerView (#\(reactTag))]: Failed to map the sent options json into an actual player configuration.\nJSON options -> \(options ?? "nil")")
        return
      }
      if view.player != nil {
        Logging.warn("RNPlayerView #\(reactTag): Player instance is already created. It will get overwritten.")
      }
      view.playerView = self?.sharedPlayerView(with: playerConfig)
      view.startBubblingEvents()
    }
  }

  /**
   Load the native player's source.
   - Parameter reactTag: Native view id.
   - Parameter options: Source configuration options from js.
   */
  @objc(loadSource:options:)
  public func loadSource(_ reactTag: NSNumber, options: Any?) {
    self.view(for: reactTag) { [weak self] view in
      guard let sourceConfig = RCTConvert.bmpSourceConfig(options) else {
        Logging.error("[NativePlayerView (#\(reactTag))]: Failed to map the sent options json into an actual source configuration.\nJSON options -> \(options ?? "nil")")
        return
      }
      guard let player = view.player else {
        self?.reportNilPlayer(reactTag)
        return
      }
      player.load(sourceConfig: sourceConfig)
    }
  }

  /**
   Unload the native player's source.
   - Parameter reactTag: Native view id.
   */
  @objc(unload:)
  public func unload(_ reactTag: NSNumber) {
    self.view(for: reactTag) { [weak self] view in
      guard let player = view.player else {
        self?.reportNilPlayer(reactTag)
        return
      }
      player.unload()
    }
  }

  /**
   Start native player's playback.
   - Parameter reactTag: Native view id.
   */
  @objc(play:)
  public func play(_ reactTag: NSNumber) {
    self.view(for: reactTag) { [weak self] view in
      guard let player = view.player else {
        self?.reportNilPlayer(reactTag)
        return
      }
      player.play()
    }
  }

  /**
   Pause native player's playback.
   - Parameter reactTag: Native view id.
   */
  @objc(pause:)
  public func pause(_ reactTag: NSNumber) {
    self.view(for: reactTag) { [weak self] view in
      guard let player = view.player else {
        self?.reportNilPlayer(reactTag)
        return
      }
      player.pause()
    }
  }

  /**
   Seek native player's playback a certain amount of time in seconds.
   - Parameter reactTag: Native view id.
   */
  @objc(seek:time:)
  public func seek(_ reactTag: NSNumber, time: NSNumber) {
    self.view(for: reactTag) { [weak self] view in
      guard let player = view.player else {
        self?.reportNilPlayer(reactTag)
        return
      }
      player.seek(time: time.doubleValue)
    }
  }

  /**
   Mute native player.
   - Parameter reactTag: Native view id.
   */
  @objc(mute:)
  public func mute(_ reactTag: NSNumber) {
    self.view(for: reactTag) { [weak self] view in
      guard let player = view.player else {
        self?.reportNilPlayer(reactTag)
        return
      }
      player.mute()
    }
  }

  /**
   Unmute native player.
   - Parameter reactTag: Native view id.
   */
  @objc(unmute:)
  public func unmute(_ reactTag: NSNumber) {
    self.view(for: reactTag) { [weak self] view in
      guard let player = view.player else {
        self?.reportNilPlayer(reactTag)
        return
      }
      player.unmute()
    }
  }

  /**
   Destroy native player instance and stop sending bubbling events to js.
   - Parameter reactTag: Native view id.
   */
  @objc(destroy:)
  public func destroy(_ reactTag: NSNumber) {
    self.view(for: reactTag) { [weak self] view in
      guard let player = view.player else {
        self?.reportNilPlayer(reactTag)
        return
      }
      player.destroy()
      view.stopBubblingEvents()
    }
  }

  /**
   Set native player's volume to a certain level.
   - Parameter reactTag: Native view id.
   - Parameter volume: Volume level between 0 to 100.
   */
  @objc(setVolume:volume:)
  public func setVolume(_ reactTag: NSNumber, volume: NSNumber) {
    self.view(for: reactTag) { [weak self] view in
      guard let player = view.player else {
        self?.reportNilPlayer(reactTag)
        return
      }
      player.volume = volume.intValue
    }
  }

  /**
   Get native player's current volume.
   - Parameter reactTag: Native view id.
   - Parameter resolver: JS promise resolver.
   - Parameter rejecter: JS promise rejecter.
   */
  @objc(getVolume:resolver:rejecter:)
  public func getVolume(
    _ reactTag: NSNumber,
    resolver resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    self.view(for: reactTag) { [weak self] view in
      guard let player = view.player else {
        self?.reportNilPlayer(reactTag)
        return
      }
      resolve(player.volume)
    }
  }

  /**
   Get the source currently loaded on the native player.
   - Parameter reactTag: Native view id.
   - Parameter resolver: JS promise resolver.
   - Parameter rejecter: JS promise rejecter.
   */
  @objc(source:resolver:rejecter:)
  public func source(
    _ reactTag: NSNumber,
    resolver resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    self.view(for: reactTag) { view in
      guard let player = view.player, let source = player.source else {
        resolve(nil)
        return
      }
      resolve([
        "duration": source.duration,
        "isActive": source.isActive,
        "isAttachedToPlayer": source.isAttachedToPlayer,
        "loadingState": source.loadingState.rawValue,
        "metadata": source.metadata ?? NSNull()
      ])
    }
  }

  /**
   Get native player's current playback time.
   - Parameter reactTag: Native view id.
   - Parameter mode: Time mode. Either `absolute` or `relative`.
   - Parameter resolver: JS promise resolver.
   - Parameter rejecter: JS promise rejecter.
   */
  @objc(currentTime:mode:resolver:rejecter:)
  public func currentTime(
    _ reactTag: NSNumber, mode: Any?,
    resolver resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: RCTPromiseRejectBlock
  ) {
    self.view(for: reactTag) { [weak self] view in
      guard let player = view.player else {
        self?.reportNilPlayer(reactTag)
        return
      }
      if let mode = mode {
        resolve(player.currentTime(RCTConvert.bmpTimeMode(mode)))
      } else {
        resolve(player.currentTime)
      }
    }
  }

  /**
   Get native player's source duration.
   - Parameter reactTag: Native view id.
   - Parameter resolver: JS promise resolver.
   - Parameter rejecter: JS promise rejecter.
   */
  @objc(duration:resolver:rejecter:)
  public func duration(
    _ reactTag: NSNumber,
    resolver resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    self.view(for: reactTag) { [weak self] view in
      guard let player = view.player else {
        self?.reportNilPlayer(reactTag)
        return
      }
      resolve(player.duration)
    }
  }

  /**
   Get native player's current muting state.
   - Parameter reactTag: Native view id.
   - Parameter resolver: JS promise resolver.
   - Parameter rejecter: JS promise rejecter.
   */
  @objc(isMuted:resolver:rejecter:)
  public func isMuted(
    _ reactTag: NSNumber,
    resolver resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    self.view(for: reactTag) { [weak self] view in
      guard let player = view.player else {
        self?.reportNilPlayer(reactTag)
        return
      }
      resolve(player.isMuted)
    }
  }

  /**
   Get native player's current playback state.
   - Parameter reactTag: Native view id.
   - Parameter resolver: JS promise resolver.
   - Parameter rejecter: JS promise rejecter.
   */
  @objc(isPlaying:resolver:rejecter:)
  public func isPlaying(
    _ reactTag: NSNumber,
    resolver resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    self.view(for: reactTag) { [weak self] view in
      guard let player = view.player else {
        self?.reportNilPlayer(reactTag)
        return
      }
      resolve(player.isPlaying)
    }
  }

  /**
   Get native player's current playback's pausing state.
   - Parameter reactTag: Native view id.
   - Parameter resolver: JS promise resolver.
   - Parameter rejecter: JS promise rejecter.
   */
  @objc(isPaused:resolver:rejecter:)
  public func isPaused(
    _ reactTag: NSNumber,
    resolver resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    self.view(for: reactTag) { [weak self] view in
      guard let player = view.player else {
        self?.reportNilPlayer(reactTag)
        return
      }
      resolve(player.isPaused)
    }
  }

  /**
   Get native player's live streaming state.
   Resolves to `true` if the current source is a live stream.
   - Parameter reactTag: Native view id.
   - Parameter resolver: JS promise resolver.
   - Parameter rejecter: JS promise rejecter.
   */
  @objc(isLive:resolver:rejecter:)
  public func isLive(
    _ reactTag: NSNumber,
    resolver resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    self.view(for: reactTag) { [weak self] view in
      guard let player = view.player else {
        self?.reportNilPlayer(reactTag)
        return
      }
      resolve(player.isLive)
    }
  }

  /**
   Get current air play activation state.
   - Parameter reactTag: Native view id.
   - Parameter resolver: JS promise resolver.
   - Parameter rejecter: JS promise rejecter.
   */
  @objc(isAirPlayActive:resolver:rejecter:)
  public func isAirPlayActive(
    _ reactTag: NSNumber,
    resolver resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    self.view(for: reactTag) { [weak self] view in
      guard let player = view.player else {
        self?.reportNilPlayer(reactTag)
        return
      }
      resolve(player.isAirPlayActive)
    }
  }

  /**
   Get air play availability state.
   - Parameter reactTag: Native view id.
   - Parameter resolver: JS promise resolver.
   - Parameter rejecter: JS promise rejecter.
   */
  @objc(isAirPlayAvailable:resolver:rejecter:)
  public func isAirPlayAvailable(
    _ reactTag: NSNumber,
    resolver resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    self.view(for: reactTag) { [weak self] view in
      guard let player = view.player else {
        self?.reportNilPlayer(reactTag)
        return
      }
      resolve(player.isAirPlayAvailable)
    }
  }

  /**
   Fetch and resolve the native `UIView` instance registered with id `reactTag` inside RN's
   UIManager.
   - Parameter reactTag: Id of the native view to lookup.
   - Parameter completion: Callback resolving the found `UIView`, if any.
   */
  private func view(
    for reactTag: NSNumber,
    completion: @escaping (RNPlayerView) -> Void
  ) {
    self.bridge.uiManager.addUIBlock { _, viewsRegistry in
      guard
        let viewsRegistry = viewsRegistry,
        let view = viewsRegistry[reactTag] as? RNPlayerView
      else {
        Logging.warn("Could not find RNPlayerView #\(reactTag) inside viewsRegistry.")
        return
      }
      completion(view)
    }
  }

  /// Helper function that encapsulates a common error message for nil player access.
  private func reportNilPlayer(_ reactTag: NSNumber) {
    Logging.error("RNPlayerView #\(reactTag): Tried to access an empty Player instance. Make sure to call .create() first.")
  }

  /// Native `PlayerView` object that bakes all instances of `<NativePlayerView />` from js on the native side.
  private var sharedPlayerView: PlayerView? = nil

  /**
   Create or reset the shared player view configuration.
   - Returns: A reference to `sharedPlayerView`.
   */
  private func sharedPlayerView(with config: PlayerConfig) -> PlayerView? {
    let player = PlayerFactory.create(playerConfig: config)
    guard let sharedPlayerView = sharedPlayerView else {
      sharedPlayerView = PlayerView(player: player, frame: .zero)
      sharedPlayerView?.autoresizingMask = [.flexibleHeight, .flexibleWidth]
      return sharedPlayerView
    }
    sharedPlayerView.player = nil
    sharedPlayerView.player = player
    return sharedPlayerView
  }
}
