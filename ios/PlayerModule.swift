import BitmovinPlayer

@objc(PlayerModule)
class PlayerModule: NSObject, RCTBridgeModule {
  /// In-memory dictionary mapping id <-> PlayerContext.
  private var registry: [String: PlayerContext] = [:]

  /// Exported module name to JS.
  static func moduleName() -> String! {
    "PlayerModule"
  }

  /// Queue in which methods will be executed. The main thread, in this case.
  var methodQueue: DispatchQueue! {
    get {
      DispatchQueue.main
    }
  }

  /// Requires module initialization from main thread.
  static func requiresMainQueueSetup() -> Bool {
    true
  }

  /**
   Resolve the current `PlayerContext` instance associated with `id`. Intented to
   be used by other RN bridge modules, such as `RNPlayerViewManager` for example.
   - Parameter id: Target player id.
   - Returns: The found player context if there's any.
   */
  @objc func playerContext(with id: String) -> PlayerContext? {
    registry[id]
  }

  /**
   Create a new `Player` instance for the given `config` if no one exists already.
   - Parameter config: Player configuration options sent from JS.
   */
  @objc(initWithConfig:)
  func initWithConfig(_ config: Any) {
    guard
      let config = config as? [String: Any],
      let id = config["id"] as? String,
      registry[id] == nil
    else {
      return
    }
    if let playerConfig = RCTConvert.bmpPlayerConfig(config) {
      registry[id] = PlayerContext(playerConfig: playerConfig)
    }
  }

  /**
   Load the source of the given `playerId` with `config` options from JS.
   - Parameter playerId: Target player.
   - Parameter config: Source configuration options from JS.
   */
  @objc(load:config:)
  func load(_ playerId: String, config: Any) {
    guard
      let context = registry[playerId],
      let sourceConfig = RCTConvert.bmpSourceConfig(config)
    else {
      return
    }
    context.load(sourceConfig: sourceConfig)
  }

  /**
   Call `.unload()` on `playerId`'s player.
   - Parameter playerId: Target player Id.
   */
  @objc(unload:)
  func unload(_ playerId: String) {
    registry[playerId]?.player.unload()
  }

  /**
   Call `.play()` on `playerId`'s player.
   - Parameter playerId: Target player Id.
   */
  @objc(play:)
  func play(_ playerId: String) {
    registry[playerId]?.player.play()
  }

  /**
   Call `.pause()` on `playerId`'s player.
   - Parameter playerId: Target player Id.
   */
  @objc(pause:)
  public func pause(_ playerId: String) {
    registry[playerId]?.player.pause()
  }

  /**
   Call `.seek(time:)` on `playerId`'s player.
   - Parameter playerId: Target player Id.
   - Parameter time: Time to seek in seconds.
   */
  @objc(seek:time:)
  public func seek(_ playerId: String, time: NSNumber) {
    registry[playerId]?.player.seek(time: time.doubleValue)
  }

  /**
   Call `.mute()` on `playerId`'s player.
   - Parameter playerId: Target player Id.
   */
  @objc(mute:)
  public func mute(_ playerId: String) {
    registry[playerId]?.player.mute()
  }

  /**
   Call `.unmute()` on `playerId`'s player.
   - Parameter playerId: Target player Id.
   */
  @objc(unmute:)
  public func unmute(_ playerId: String) {
    registry[playerId]?.player.unmute()
  }

  /**
   Call `.destroy()` on `playerId`'s player.
   - Parameter playerId: Target player Id.
   */
  @objc(destroy:)
  func destroy(_ playerId: String) {
    registry[playerId]?.player.destroy()
  }

  /**
   Call `.setVolume(volume:)` on `playerId`'s player.
   - Parameter playerId: Target player Id.
   - Parameter volume: Integer representing the volume level (between 0 to 100).
   */
  @objc(setVolume:volume:)
  public func setVolume(_ playerId: String, volume: NSNumber) {
    registry[playerId]?.player.volume = volume.intValue
  }

  /**
   Resolve the source of `playerId`'s player.
   - Parameter playerId: Target player Id.
   - Parameter resolver: JS promise resolver.
   - Parameter rejecter: JS promise rejecter.
   */
  @objc(getSource:resolver:rejecter:)
  func getSource(
    _ playerId: String,
    resolver resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    resolve(registry[playerId]?.player.source?.toJSON())
  }

  /**
   Resolve `playerId`'s current volume.
   - Parameter playerId: Target player Id.
   - Parameter resolver: JS promise resolver.
   - Parameter rejecter: JS promise rejecter.
   */
  @objc(getVolume:resolver:rejecter:)
  public func getVolume(
    _ playerId: String,
    resolver resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    resolve(registry[playerId]?.player.volume)
  }

  /**
   Resolve `playerId`'s current playback time.
   - Parameter playerId: Target player Id.
   - Parameter mode: Time mode: either relative or absolute. Can be empty.
   - Parameter resolver: JS promise resolver.
   - Parameter rejecter: JS promise rejecter.
   */
  @objc(currentTime:mode:resolver:rejecter:)
  public func currentTime(
    _ playerId: String,
    mode: String?,
    resolver resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: RCTPromiseRejectBlock
  ) {
    let player = registry[playerId]?.player
    if let mode = mode {
      resolve(player?.currentTime(RCTConvert.bmpTimeMode(mode)))
    } else {
      resolve(player?.currentTime)
    }
  }

  /**
   Resolve `playerId`'s active source duration.
   - Parameter playerId: Target player Id.
   - Parameter resolver: JS promise resolver.
   - Parameter rejecter: JS promise rejecter.
   */
  @objc(duration:resolver:rejecter:)
  public func duration(
    _ playerId: String,
    resolver resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    resolve(registry[playerId]?.player.duration)
  }

  /**
   Resolve `playerId`'s current muted state.
   - Parameter playerId: Target player Id.
   - Parameter resolver: JS promise resolver.
   - Parameter rejecter: JS promise rejecter.
   */
  @objc(isMuted:resolver:rejecter:)
  public func isMuted(
    _ playerId: String,
    resolver resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    resolve(registry[playerId]?.player.isMuted)
  }


  /**
   Resolve `playerId`'s current playing state.
   - Parameter playerId: Target player Id.
   - Parameter resolver: JS promise resolver.
   - Parameter rejecter: JS promise rejecter.
   */
  @objc(isPlaying:resolver:rejecter:)
  public func isPlaying(
    _ playerId: String,
    resolver resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    resolve(registry[playerId]?.player.isPlaying)
  }

  /**
   Resolve `playerId`'s current paused state.
   - Parameter playerId: Target player Id.
   - Parameter resolver: JS promise resolver.
   - Parameter rejecter: JS promise rejecter.
   */
  @objc(isPaused:resolver:rejecter:)
  public func isPaused(
    _ playerId: String,
    resolver resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    resolve(registry[playerId]?.player.isPaused)
  }

  /**
   Resolve `playerId`'s live streaming state.
   `true` if source is a live streaming.
   - Parameter playerId: Target player Id.
   - Parameter resolver: JS promise resolver.
   - Parameter rejecter: JS promise rejecter.
   */
  @objc(isLive:resolver:rejecter:)
  public func isLive(
    _ playerId: String,
    resolver resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    resolve(registry[playerId]?.player.isLive)
  }

  /**
   Resolve `playerId`'s air play activation state.
   - Parameter playerId: Target player Id.
   - Parameter resolver: JS promise resolver.
   - Parameter rejecter: JS promise rejecter.
   */
  @objc(isAirPlayActive:resolver:rejecter:)
  public func isAirPlayActive(
    _ playerId: String,
    resolver resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    resolve(registry[playerId]?.player.isAirPlayActive)
  }

  /**
   Resolve `playerId`'s air play availability state.
   - Parameter playerId: Target player Id.
   - Parameter resolver: JS promise resolver.
   - Parameter rejecter: JS promise rejecter.
   */
  @objc(isAirPlayAvailable:resolver:rejecter:)
  public func isAirPlayAvailable(
    _ playerId: String,
    resolver resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    resolve(registry[playerId]?.player.isAirPlayAvailable)
  }
}
