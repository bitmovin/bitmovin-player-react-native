import BitmovinCollector
import BitmovinPlayer

@objc(PlayerAnalyticsModule)
public class PlayerAnalyticsModule: NSObject, RCTBridgeModule {
    // swiftlint:disable:next implicitly_unwrapped_optional
    @objc public var bridge: RCTBridge!

    @objc var playerModule: PlayerModule? {
        bridge.module(for: PlayerModule.self) as? PlayerModule
    }

    // swiftlint:disable:next implicitly_unwrapped_optional
    public static func moduleName() -> String! {
        "PlayerAnalyticsModule"
    }

    public static func requiresMainQueueSetup() -> Bool {
        true
    }

    // swiftlint:disable:next implicitly_unwrapped_optional
    public var methodQueue: DispatchQueue! {
        bridge.uiManager.methodQueue
    }

    /**
     Sends a sample with the provided custom data.
     Does not change the configured custom data of the collector or source.
     - Parameter playerId: Native Id of the player instance.
     - Parameter json: Custom data config json.
     */
    @objc(sendCustomDataEvent:json:)
    func sendCustomDataEvent(_ playerId: NativeId, json: Any?) {
        bridge.uiManager.addUIBlock { [weak self] _, _ in
            guard
                let playerAnalytics = self?.playerModule?.retrieve(playerId)?.analytics,
                let customData = RCTConvert.analyticsCustomData(json)
            else {
                return
            }
            playerAnalytics.sendCustomDataEvent(customData: customData)
        }
    }

    /**
     Gets the current user Id for a `BitmovinPlayerCollector` instance.
     - Parameter playerId: Native Id of the the player instance.
     - Parameter resolver: JS promise resolver.
     - Parameter rejecter: JS promise rejecter.
     */
    @objc(getUserId:resolver:rejecter:)
    func getUserId(
        _ playerId: NativeId,
        resolver resolve: @escaping RCTPromiseResolveBlock,
        rejecter reject: @escaping RCTPromiseRejectBlock
    ) {
        bridge.uiManager.addUIBlock { [weak self] _, _ in
            guard let playerAnalytics = self?.playerModule?.retrieve(playerId)?.analytics else {
                reject("[PlayerAnalyticsModule]", "Could not find player with ID (\(playerId))", nil)
                return
            }
            resolve(playerAnalytics.userId)
        }
    }
}
