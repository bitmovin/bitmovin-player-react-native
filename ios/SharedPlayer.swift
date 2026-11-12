import BitmovinCollector
import BitmovinPlayer
import ExpoModulesCore
import Foundation

public final class SharedPlayer: SharedObject {
    private let factory: () -> Player
    private let events = SharedObjectEvents()
    private let callback: CallbackScope?
    private var isDestroyed = false
    // Cleanup must not evaluate the lazy property for an unused player.
    private weak var initializedPlayer: Player?
    private lazy var sdkPlayer: Player = {
        let player = factory()
        player.add(listener: events)
        initializedPlayer = player
        return player
    }()

    /// SDK player for native integrations. Access on main and retain this owner while using the player.
    public var player: Player {
        get throws {
            guard !isDestroyed || initializedPlayer != nil else {
                throw Exception(name: "DestroyedObject", description: "Destroyed before SDK creation")
            }
            return sdkPlayer
        }
    }

    deinit {
        // Cancel preprocessing before SDK cleanup can wait for its completion.
        callback?.close()
        // Expo finalizers cannot await the SDK's required main-thread cleanup.
        guard let player = initializedPlayer else { return }
        let events = events
        DispatchQueue.main.async {
            player.remove(listener: events)
            if !player.isDestroyed { player.destroy() }
        }
    }

    func destroy() {
        callback?.close()
        guard !isDestroyed else { return }
        isDestroyed = true
        // Keep listeners attached for the SDK's final DestroyEvent.
        initializedPlayer?.destroy()
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
            throw Exception(name: "InvalidArgument", description: "Invalid analytics configuration")
        }
        let metadata = RCTConvert.analyticsDefaultMetadataFromAnalyticsConfig(analyticsConfig)
        return SharedPlayer(factory: {
            if let analytics {
                return PlayerFactory.create(
                    playerConfig: playerConfig,
                    analyticsConfig: analytics,
                    defaultMetadata: metadata ?? DefaultMetadata()
                )
            }
            return PlayerFactory.create(playerConfig: playerConfig)
        }, callback: callback)
    }
    private init(factory: @escaping () -> Player, callback: CallbackScope?) {
        self.factory = factory
        self.callback = callback
        super.init()
        events.owner = self
    }
}
