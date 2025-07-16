import BitmovinCollector
import BitmovinPlayer
import ExpoModulesCore

/**
 * Expo module for PlayerAnalytics management.
 * Provides analytics functionality for player instances.
 */
public class PlayerAnalyticsModule: Module {
    public func definition() -> ModuleDefinition {
        Name("PlayerAnalyticsModule")

        AsyncFunction("sendCustomDataEvent") { [weak self] (playerId: String, json: [String: Any]) in
            guard
                let playerExpoModule = self?.appContext?.moduleRegistry.get(PlayerModule.self)
                    as? PlayerModule,
                let player = playerExpoModule.retrieve(playerId),
                let playerAnalytics = player.analytics,
                let customData = RCTConvert.analyticsCustomData(json)
            else {
                return
            }
            playerAnalytics.sendCustomDataEvent(customData: customData)
        }.runOnQueue(.main)

        AsyncFunction("getUserId") { [weak self] (playerId: String) -> String? in
            guard
                let playerExpoModule = self?.appContext?.moduleRegistry.get(PlayerModule.self)
                    as? PlayerModule,
                let player = playerExpoModule.retrieve(playerId),
                let playerAnalytics = player.analytics
            else {
                return nil
            }
            return playerAnalytics.userId
        }.runOnQueue(.main)
    }
}
