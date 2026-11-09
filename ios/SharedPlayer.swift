import BitmovinCollector
import BitmovinPlayer
import ExpoModulesCore
import Foundation

public final class SharedPlayer: SharedObject {
    let player: Player
    var source: SharedSource?
    private let events = SharedObjectEvents()
    private let callback: CallbackScope?

    private init(player: Player, callback: CallbackScope?) {
        self.player = player
        self.callback = callback
        super.init()
        events.owner = self
        player.add(listener: events)
    }

    deinit {
        // Expo finalizers cannot await the SDK's required main-thread cleanup.
        let player = player
        let events = events
        DispatchQueue.main.async {
            player.remove(listener: events)
            if !player.isDestroyed { player.destroy() }
        }
        callback?.close()
    }

    func destroy() {
        callback?.close()
        // Keep listeners attached for the SDK's final DestroyEvent.
        if !player.isDestroyed { player.destroy() }
        source = nil
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
#if os(iOS)
        weak var owner: SharedPlayer?
        playerConfig.remoteControlConfig.prepareSource = { _, sourceConfig in
            guard let source = owner?.source, source.source.sourceConfig === sourceConfig else { return nil }
            return source.castSourceConfig
        }
#endif
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
        let shared = SharedPlayer(player: player, callback: callback)
#if os(iOS)
        owner = shared
#endif
        return shared
    }
}
