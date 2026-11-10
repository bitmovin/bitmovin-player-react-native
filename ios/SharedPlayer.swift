import BitmovinCollector
import BitmovinPlayer
import ExpoModulesCore
import Foundation

public final class SharedPlayer: SharedObject {
    /// SDK player for native integrations. Retain this owner while using the player.
    public let player: Player
    private let callback: CallbackScope?

    private init(player: Player, callback: CallbackScope?) {
        self.player = player
        self.callback = callback
        super.init()
    }

    deinit {
        // Expo finalizers cannot await the SDK's required main-thread cleanup.
        let player = player
        DispatchQueue.main.async {
            if !player.isDestroyed { player.destroy() }
        }
        callback?.close()
    }

    func destroy() {
        callback?.close()
        // Keep listeners attached for the SDK's final DestroyEvent.
        player.destroy()
    }

    static func create(
        config: [String: Any]?,
        analyticsConfig: [String: Any]?,
        callback: CallbackScope?
    ) throws -> SharedPlayer {
        let playerConfig = RCTConvert.playerConfig(config, callback: callback)
        let analytics = analyticsConfig.flatMap { RCTConvert.analyticsConfig($0) }
        guard analyticsConfig == nil || analytics != nil else {
            callback?.close()
            throw Exception(name: "InvalidAnalyticsConfig", description: "Invalid analytics configuration")
        }
        let player: Player
        if let analytics {
            let metadata = RCTConvert.analyticsDefaultMetadataFromAnalyticsConfig(analyticsConfig)
            player = PlayerFactory.create(
                playerConfig: playerConfig,
                analyticsConfig: analytics,
                defaultMetadata: metadata ?? DefaultMetadata()
            )
        } else {
            player = PlayerFactory.create(playerConfig: playerConfig)
        }
        return SharedPlayer(player: player, callback: callback)
    }
}
