import BitmovinCollector
import BitmovinPlayer
import ExpoModulesCore
import Foundation

public final class SharedPlayer: SharedObject {
    let player: Player
    var source: SharedSource?
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
        if !player.isDestroyed { player.destroy() }
        source = nil
    }

    static func create(
        config: [String: Any]?,
        analyticsConfig: [String: Any]?,
        callback: CallbackScope?
    ) throws -> SharedPlayer {
        let playerConfig = RCTConvert.playerConfig(config)
        let analytics = analyticsConfig.flatMap { RCTConvert.analyticsConfig($0) }
        guard analyticsConfig == nil || analytics != nil else {
            callback?.close()
            throw Exception(name: "InvalidAnalyticsConfig", description: "Invalid analytics configuration")
        }
        if let network = config?["networkConfig"] as? [String: Any] {
            playerConfig.networkConfig = RCTConvert.networkConfig(network, callback: callback)
        }
        setupShouldLoadAdItem(config: config, playerConfig: playerConfig, callback: callback)
        setupImaBeforeInitialization(config: config, playerConfig: playerConfig, callback: callback)
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

    private static func setupShouldLoadAdItem(
        config: [String: Any]?,
        playerConfig: PlayerConfig,
        callback: CallbackScope?
    ) {
        guard let advertising = config?["advertisingConfig"] as? [String: Any],
              advertising["shouldLoadAdItem"] != nil else { return }
        playerConfig.advertisingConfig.shouldLoadAdItem = { adItem in
            callback?.call(
                "advertisingConfig.shouldLoadAdItem",
                arguments: [RCTConvert.toJson(adItem: adItem) as Any]
            ) as? Bool ?? true
        }
    }

    private static func setupImaBeforeInitialization(
        config: [String: Any]?,
        playerConfig: PlayerConfig,
        callback: CallbackScope?
    ) {
        guard let advertising = config?["advertisingConfig"] as? [String: Any],
              let ima = advertising["ima"] as? [String: Any], ima["beforeInitialization"] != nil else { return }
        playerConfig.advertisingConfig.beforeInitialization = { settings in
            guard let value = callback?.call(
                "advertisingConfig.ima.beforeInitialization",
                arguments: [RCTConvert.imaSettingsDictionary(settings)],
                mutating: true
            ) as? [String: Any] else { return }
            RCTConvert.applyImaSettings(settings, from: value)
        }
    }
}
