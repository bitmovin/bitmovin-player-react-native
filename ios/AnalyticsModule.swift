import BitmovinPlayer
import BitmovinAnalyticsCollector

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

    @objc(attach:playerId:)
    func attach(_ nativeId: NativeId, playerId: String) {
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

    @objc(detach:)
    func detach(_ nativeId: NativeId) {
        bridge.uiManager.addUIBlock { [weak self] _, _ in
            guard let collector = self?.collectors[nativeId] else {
                return
            }
            collector.detachPlayer()
        }
    }

    @objc(setCustomData:json:)
    func setCustomData(_ nativeId: NativeId, json: Any?) {
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

    @objc(getCustomData:resolver:rejecter:)
    func getCustomData(
        _ nativeId: NativeId,
        resolver resolve: @escaping RCTPromiseResolveBlock,
        rejecter reject: @escaping RCTPromiseRejectBlock
    ) {
        bridge.uiManager.addUIBlock { [weak self] _, _ in
            guard
                let collector = self?.collectors[nativeId],
                let customData = RCTConvert.toJson(analyticsCustomData: collector.getCustomData())
            else {
                return
            }
            resolve(customData)
        }
    }

    @objc(getUserId:resolver:rejecter:)
    func getUserId(
        _ nativeId: NativeId,
        resolver resolve: @escaping RCTPromiseResolveBlock,
        rejecter reject: @escaping RCTPromiseRejectBlock
    ) {
        bridge.uiManager.addUIBlock { [weak self] _, _ in
            guard let collector = self?.collectors[nativeId] else {
                return
            }
            resolve(collector.getUserId())
        }
    }
}
