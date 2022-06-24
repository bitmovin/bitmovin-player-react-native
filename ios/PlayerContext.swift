import BitmovinPlayer

/**
 Object that holds a `Player`, its initial source configuration, and delays
 the source loading until the `Player` gets attached to a `PlayerView`.

 `Player.load(sourceConfig:)` cannot be called before the player gets attached
 to a `PlayerView` or a crash happens. Therefore, this object aims to solve this
 problem by storing the last source the user tried to load and actually loading
 it when the player becomes ready.
 */
@objc class PlayerContext: NSObject {
  /// `Player` instance.
  let player: Player
  /// Initial source configuration waiting to be loaded once the player is ready
  private var pendingSourceConfig: SourceConfig?
  /// Flag signaling whether the player has been attached to a view or not.
  private var isPlayerAttachedToView = false

  init(playerConfig: PlayerConfig) {
    self.player = PlayerFactory.create(playerConfig: playerConfig)
  }

  /**
   Provide a way to register a source config be loaded immediatelly or in the near future
   depending whether its player has been attached to a `PlayerView` yet or not.
   - Parameter sourceConfig: Source config to be loaded.
   */
  func load(sourceConfig: SourceConfig) {
    if !isPlayerAttachedToView {
      pendingSourceConfig = sourceConfig
    } else {
      player.load(sourceConfig: sourceConfig)
    }
  }

  /**
   This method is called by `RNPlayerViewManager` when the view player gets set
   through `setPlayer` command. Then the `pendingSourceConfig` gets loaded only
   once no matter how many times this method gets called.
   */
  func loadPendingSource() {
    if !isPlayerAttachedToView, let pendingSourceConfig = pendingSourceConfig {
      player.load(sourceConfig: pendingSourceConfig)
      isPlayerAttachedToView = true
    }
  }
}
