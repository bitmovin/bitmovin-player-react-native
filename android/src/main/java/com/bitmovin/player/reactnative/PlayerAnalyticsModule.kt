package com.bitmovin.player.reactnative

import com.bitmovin.player.api.analytics.AnalyticsApi
import com.bitmovin.player.api.analytics.AnalyticsApi.Companion.analytics
import com.bitmovin.player.reactnative.converter.toAnalyticsCustomData
import expo.modules.kotlin.Promise
import expo.modules.kotlin.functions.Queues
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

/**
 * Expo module for PlayerAnalytics management.
 * Provides analytics functionality for player instances.
 */
class PlayerAnalyticsModule : Module() {

    override fun definition() = ModuleDefinition {
        Name("PlayerAnalyticsModule")

        AsyncFunction("sendCustomDataEvent") { owner: SharedPlayer, json: Map<String, Any?>, promise: Promise ->
            try {
                val analytics = getAnalyticsForPlayer(owner)
                analytics.sendCustomDataEvent(json.toAnalyticsCustomData())
                promise.resolve(null)
            } catch (e: Exception) {
                promise.reject("PlayerAnalyticsError", "Failed to send custom data event", e)
            }
        }.runOnQueue(Queues.MAIN)

        AsyncFunction("getUserId") { owner: SharedPlayer, promise: Promise ->
            try {
                val analytics = getAnalyticsForPlayer(owner)
                promise.resolve(analytics.userId)
            } catch (e: Exception) {
                promise.reject("PlayerAnalyticsError", "Failed to get user ID", e)
            }
        }.runOnQueue(Queues.MAIN)
    }

    /**
     * Helper method to get analytics for a player instance.
     */
    private fun getAnalyticsForPlayer(owner: SharedPlayer): AnalyticsApi {
        val player = owner.player
        return player.analytics ?: throw IllegalStateException("Analytics is disabled")
    }
}
