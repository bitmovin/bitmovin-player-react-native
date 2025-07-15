package com.bitmovin.player.reactnative

import com.bitmovin.player.api.analytics.AnalyticsApi
import com.bitmovin.player.api.analytics.AnalyticsApi.Companion.analytics
import com.bitmovin.player.reactnative.converter.toAnalyticsCustomData
import expo.modules.kotlin.Promise
import expo.modules.kotlin.functions.Queues
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

private const val MODULE_NAME = "PlayerAnalyticsExpoModule"

/**
 * Expo module for PlayerAnalytics management.
 * Provides analytics functionality for player instances.
 */
class PlayerAnalyticsExpoModule : Module() {

    override fun definition() = ModuleDefinition {
        Name(MODULE_NAME)

        AsyncFunction("sendCustomDataEvent") { playerId: String, json: Map<String, Any?>, promise: Promise ->
            try {
                val analytics = getAnalyticsForPlayer(playerId)
                analytics.sendCustomDataEvent(json.toAnalyticsCustomData())
                promise.resolve(null)
            } catch (e: Exception) {
                promise.reject("PlayerAnalyticsError", "Failed to send custom data event", e)
            }
        }.runOnQueue(Queues.MAIN)

        AsyncFunction("getUserId") { playerId: String, promise: Promise ->
            try {
                val analytics = getAnalyticsForPlayer(playerId)
                promise.resolve(analytics.userId)
            } catch (e: Exception) {
                promise.reject("PlayerAnalyticsError", "Failed to get user ID", e)
            }
        }.runOnQueue(Queues.MAIN)
    }

    /**
     * Helper method to get analytics for a player instance.
     */
    private fun getAnalyticsForPlayer(playerId: String): AnalyticsApi {
        // Get the player from PlayerExpoModule
        val playerExpoModule = appContext.registry.getModule<PlayerExpoModule>()
        val player = playerExpoModule?.getPlayerOrNull(playerId) ?: throw IllegalStateException(
            "Could not find player with ID $playerId",
        )
        return player.analytics ?: throw IllegalStateException("Analytics is disabled")
    }
}
