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

        AsyncFunction("sendCustomDataEvent") { (owner: SharedPlayer, json: [String: Any]) in
            let player = try owner.player
            guard
                let playerAnalytics = player.analytics,
                let customData = RCTConvert.analyticsCustomData(json)
            else {
                return
            }
            playerAnalytics.sendCustomDataEvent(customData: customData)
        }.runOnQueue(.main)

        AsyncFunction("getUserId") { (owner: SharedPlayer) -> String? in
            let player = try owner.player
            guard
                let playerAnalytics = player.analytics
            else {
                return nil
            }
            return playerAnalytics.userId
        }.runOnQueue(.main)
    }
}
