import BitmovinCollector
import BitmovinPlayer
import ExpoModulesCore
import ExpoModulesJSI
import Foundation

public final class SharedPlayer: SharedObject {
    private let factory: () -> Player
    private let events = SharedObjectEvents()
    // Outstanding SDK HTTP completions must receive their fallback when this owner is destroyed.
    private let pendingCallbacks = Mutex<[CancellableCallback]?>([])
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
        closeCallbacks()
        // Expo finalizers cannot await the SDK's required main-thread cleanup.
        guard let player = initializedPlayer else { return }
        let events = events
        DispatchQueue.main.async {
            player.remove(listener: events)
            if !player.isDestroyed { player.destroy() }
        }
    }

    func destroy() {
        closeCallbacks()
        guard !isDestroyed else { return }
        isDestroyed = true
        // Keep listeners attached for the SDK's final DestroyEvent.
        initializedPlayer?.destroy()
    }

    @JavaScriptActor
    static func create(
        config: JavaScriptValue?,
        analyticsConfig: [String: Any]?,
        context: AppContext
    ) throws -> SharedPlayer {
        let playerConfig = RCTConvert.playerConfig(config, context: context)
        let analytics = analyticsConfig.flatMap { RCTConvert.analyticsConfig($0) }
        guard analyticsConfig == nil || analytics != nil else {
            throw Exception(name: "InvalidArgument", description: "Invalid analytics configuration")
        }
        let metadata = RCTConvert.analyticsDefaultMetadataFromAnalyticsConfig(analyticsConfig)
        let owner = SharedPlayer {
            if let analytics {
                return PlayerFactory.create(
                    playerConfig: playerConfig,
                    analyticsConfig: analytics,
                    defaultMetadata: metadata ?? DefaultMetadata()
                )
            }
            return PlayerFactory.create(playerConfig: playerConfig)
        }
        if let network = RCTConvert.networkConfig(
            config?.property("networkConfig"), context: context, track: { [weak owner] request in
                if let owner { owner.track(request) } else { request.cancel() }
            }
        ) { playerConfig.networkConfig = network }
        return owner
    }
    private func track(_ request: CancellableCallback) {
        let active = pendingCallbacks.withLock { pending in
            guard pending != nil else { return false }
            pending?.append(request)
            return true
        }
        guard active else { request.cancel(); return }
        request.didComplete { [weak self, weak request] in
            self?.pendingCallbacks.withLock { $0?.removeAll { $0 === request } }
        }
    }

    private func closeCallbacks() {
        let pending = pendingCallbacks.withLock { pending in
            defer { pending = nil }
            return pending ?? []
        }
        pending.forEach { $0.cancel() }
    }

    private init(factory: @escaping () -> Player) {
        self.factory = factory
        super.init()
        events.owner = self
    }
}
