import BitmovinPlayer
import BitmovinCollector

@objc(AnalyticsModule)
class AnalyticsModule: NSObject, RCTBridgeModule {
    /// React bridge reference.
    @objc var bridge: RCTBridge!

    /// PlayerModule instance fetched from the bridge's registry
    @objc var playerModule: PlayerModule? {
        bridge.module(for: PlayerModule.self) as? PlayerModule
    }

    /// In-memory mapping from `nativeId`s to `BitmovinPlayerCollector` instances.
    private var collectors: Registry<BitmovinPlayerCollector> = [:]

    /// JS module name.
    static func moduleName() -> String! {
        "AnalyticsModule"
    }

    /// Module requires main thread initialization.
    static func requiresMainQueueSetup() -> Bool {
        true
    }

    /// Use `UIManager.addBlock` to enqueue module methods on UI thread.
    var methodQueue: DispatchQueue! {
        bridge.uiManager.methodQueue
    }

    /**
     Retrieves a `BitmovinPlayerCollector` instance from the internal registry for the given `nativeId`.
     - Parameter nativeId: Native Id of the collector instance.
     - Returns: Collector instance associated with the `nativeId` or `nil`.
     */
    @objc func retrieve(_ nativeId: NativeId) -> BitmovinPlayerCollector? {
        collectors[nativeId]
    }

    /**
     Creates a new `BitmovinPlayerCollector` instance inside the internal registry using the provided `config` object.
     - Parameter nativeId: ID to associate with the `BitmovinPlayerCollector` instance.
     - Parameter config: `BitmovinAnalyticsConfig` object received from JS.
     */
    @objc(initWithConfig:config:)
    func initWithConfig(_ nativeId: NativeId, config: Any?) {
        bridge.uiManager.addUIBlock { [weak self] _, _ in
            guard let analyticsConfig = RCTConvert.analyticsConfig(config) else {
                return
            }
            self?.collectors[nativeId] = BitmovinPlayerCollector(config: analyticsConfig)
        }
    }

    /**
     Detaches and removes the given `BitmovinPlayerCollector` from the internal registry.
     - Parameter nativeId: Native Id of the collector instance.
     */
    @objc(destroy:)
    func destroy(_ nativeId: NativeId) {
        bridge.uiManager.addUIBlock { [weak self] _, _ in
            self?.collectors[nativeId]?.detachPlayer()
            self?.collectors[nativeId] = nil
        }
    }

    /**
     Attaches a `BitmovinPlayerCollector` to the `Player` instance with native Id equal to `playerId`.
     - Parameter nativeId: Native Id of the collector instance.
     - Parameter playerId: Native Id of the player instance.
     */
    @objc(attach:playerId:)
    func attach(_ nativeId: NativeId, playerId: NativeId) {
        bridge.uiManager.addUIBlock { [weak self] _, _ in
            guard
                let collector = self?.collectors[nativeId],
                let player = self?.playerModule?.retrieve(playerId)
            else {
                return
            }
            collector.attachPlayer(player: player)
        }
    }

    /**
     Detaches the player object from a `BitmovinPlayerCollector` instance.
     - Parameter nativeId: Native Id of the collector instance.
     */
    @objc(detach:)
    func detach(_ nativeId: NativeId) {
        bridge.uiManager.addUIBlock { [weak self] _, _ in
            guard let collector = self?.collectors[nativeId] else {
                return
            }
            collector.detachPlayer()
        }
    }

    /**
     Updates the custom data config for a `BitmovinPlayerCollector` instance.
     - Parameter nativeId: Native Id of the collector instance.
     - Parameter json: Custom data config json.
     */
    @objc(setCustomDataOnce:json:)
    func setCustomDataOnce(_ nativeId: NativeId, json: Any?) {
        bridge.uiManager.addUIBlock { [weak self] _, _ in
            guard
                let collector = self?.collectors[nativeId],
                let customData = RCTConvert.analyticsCustomData(json)
            else {
                return
            }
            collector.setCustomDataOnce(customData: customData)
        }
    }

    /**
     Sets the custom data config for a `BitmovinPlayerCollector` instance.
     - Parameter nativeId: Native Id of the collector instance.
     - Parameter playerId: Native Id of the player instance.
     - Parameter json: Custom data config json.
     */
    @objc(setCustomData:playerId:json:)
    func setCustomData(
        _ nativeId: NativeId,
        playerId: NativeId?,
        json: Any?
    ) {
        bridge.uiManager.addUIBlock { [weak self] _, _ in
            guard
                let collector = self?.collectors[nativeId],
                let customData = RCTConvert.analyticsCustomData(json),
                let playerId = playerId,
                let player = self?.bridge[PlayerModule.self]?.retrieve(playerId),
                let source = player.source
            else {
                return
            }
            collector.apply(customData: customData, for: source)
        }
    }

    /**
     Gets the current custom data config for a `BitmovinPlayerCollector` instance.
     - Parameter nativeId: Native Id of the the collector instance.
     - Parameter playerId: Native Id of the player instance.
     - Parameter resolver: JS promise resolver.
     - Parameter rejecter: JS promise rejecter.
     */
    @objc(getCustomData:playerId:resolver:rejecter:)
    func getCustomData(
        _ nativeId: NativeId,
        playerId: NativeId?,
        resolver resolve: @escaping RCTPromiseResolveBlock,
        rejecter reject: @escaping RCTPromiseRejectBlock
    ) {
        bridge.uiManager.addUIBlock { [weak self] _, _ in
            guard
                let collector = self?.collectors[nativeId],
                let playerId = playerId,
                let player = self?.bridge[PlayerModule.self]?.retrieve(playerId),
                let source = player.source,
                let customData = RCTConvert.toJson(analyticsCustomData: collector.customData(for: source))
            else {
                reject("[AnalyticsModule]", "Could not find analytics collector with ID (\(nativeId))", nil)
                return
            }
            resolve(customData)
        }
    }

    /**
     Gets the current user Id for a `BitmovinPlayerCollector` instance.
     - Parameter nativeId: Native Id of the the collector instance.
     - Parameter resolver: JS promise resolver.
     - Parameter rejecter: JS promise rejecter.
     */
    @objc(getUserId:resolver:rejecter:)
    func getUserId(
        _ nativeId: NativeId,
        resolver resolve: @escaping RCTPromiseResolveBlock,
        rejecter reject: @escaping RCTPromiseRejectBlock
    ) {
        bridge.uiManager.addUIBlock { [weak self] _, _ in
            guard let collector = self?.collectors[nativeId] else {
                reject("[AnalyticsModule]", "Could not find analytics collector with ID (\(nativeId))", nil)
                return
            }
            resolve(collector.getUserId())
        }
    }
}
