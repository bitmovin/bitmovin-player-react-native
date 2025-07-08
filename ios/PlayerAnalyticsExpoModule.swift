import BitmovinCollector
import BitmovinPlayer
import ExpoModulesCore

/**
 * Expo module for PlayerAnalytics management.
 * Provides analytics functionality for player instances.
 */
public class PlayerAnalyticsExpoModule: Module {

    public func definition() -> ModuleDefinition {
        Name("PlayerAnalyticsExpoModule")

        AsyncFunction("sendCustomDataEvent") { (playerId: String, json: [String: Any]) in
            await withCheckedContinuation { continuation in
                DispatchQueue.main.async {
                    guard
                        let playerExpoModule = self.appContext?.legacyModule(for: PlayerExpoModule.self) as? PlayerExpoModule,
                        let player = playerExpoModule.retrieve(playerId),
                        let playerAnalytics = player.analytics,
                        let customData = RCTConvert.analyticsCustomData(json)
                    else {
                        continuation.resume()
                        return
                    }
                    playerAnalytics.sendCustomDataEvent(customData: customData)
                    continuation.resume()
                }
            }
        }

        AsyncFunction("getUserId") { (playerId: String) -> String? in
            return await withCheckedContinuation { continuation in
                DispatchQueue.main.async {
                    guard
                        let playerExpoModule = self.appContext?.legacyModule(for: PlayerExpoModule.self) as? PlayerExpoModule,
                        let player = playerExpoModule.retrieve(playerId),
                        let playerAnalytics = player.analytics
                    else {
                        continuation.resume(returning: nil)
                        return
                    }
                    continuation.resume(returning: playerAnalytics.userId)
                }
            }
        }
    }

    /**
     * Static access method to maintain compatibility with other modules.
     */
    @objc
    public static func getPlayerAnalytics(_ playerId: String) -> BitmovinPlayerCollector? {
        // TODO: Implement global registry pattern if needed by other modules
        return nil
    }
}