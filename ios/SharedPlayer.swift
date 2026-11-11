import BitmovinCollector
import BitmovinPlayer
import ExpoModulesCore
import Foundation

public final class SharedPlayer: SharedObject {
    /// SDK player for native integrations. Retain this owner while using the player.
    private let initialization: SharedObjectInitialization<Player>
    public var player: Player { get throws { try initialize() } }
    private let events = SharedObjectEvents()
    private let callback: CallbackScope?

    private init(factory: @escaping () throws -> Player, callback: CallbackScope?) {
        initialization = SharedObjectInitialization(factory)
        self.callback = callback
        super.init()
        events.owner = self
    }

    @discardableResult
    func initialize() throws -> Player {
        do {
            let player = try initialization.get()
            if !isObserving { player.add(listener: events); isObserving = true }
            return player
        } catch { callback?.close(); throw error }
    }
    private var isObserving = false

    deinit {
        // Cancel preprocessing before SDK cleanup can wait for its completion.
        callback?.close()
        // Expo finalizers cannot await the SDK's required main-thread cleanup.
        guard let player = initialization.initializedValue else { return }
        let events = events
        DispatchQueue.main.async {
            player.remove(listener: events)
            if !player.isDestroyed { player.destroy() }
        }
    }

    func destroy() {
        callback?.close()
        // Keep listeners attached for the SDK's final DestroyEvent.
        initialization.initializedValue?.destroy()
        initialization.cancel()
    }

    static func create(
        config: [String: Any]?,
        analyticsConfig: [String: Any]?,
        callback: CallbackScope?
    ) throws -> SharedPlayer {
        SharedPlayer(factory: {
        let playerConfig = RCTConvert.playerConfig(config, callback: callback)
        let analytics = analyticsConfig.flatMap { RCTConvert.analyticsConfig($0) }
        guard analyticsConfig == nil || analytics != nil else {
            callback?.close()
            throw Exception(name: "InvalidArgument", description: "Invalid analytics configuration")
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
        return player
        }, callback: callback)
    }
}
