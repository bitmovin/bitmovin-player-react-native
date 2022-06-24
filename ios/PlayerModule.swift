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
   Call `.play()` on `playerId`'s player.
   - Parameter playerId: Target player Id.
   */
  @objc(play:)
  func play(_ playerId: String) {
    guard let context = registry[playerId] else {
      return
    }
    context.player.play()
  }

  /**
   Call `.destroy()` on `playerId`'s player.
   - Parameter playerId: Target player Id.
   */
  @objc(destroy:)
  func destroy(_ playerId: String) {
    guard let context = registry[playerId] else {
      return
    }
    context.player.destroy()
  }

  /**
   Resolve the source of `playerId`'s player.
   - Parameter playerId: Target player Id;
   - Parameter resolver: JS promise resolver.
   - Parameter rejecter: JS promise rejecter.
   */
  @objc(getSource:resolver:rejecter:)
  func getSource(
    _ playerId: String,
    resolver resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    guard let context = registry[playerId] else {
      return
    }
    resolve(context.player.source?.toJSON())
  }
}
