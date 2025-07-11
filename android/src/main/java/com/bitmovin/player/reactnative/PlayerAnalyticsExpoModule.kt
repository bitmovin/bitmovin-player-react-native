package com.bitmovin.player.reactnative

import com.bitmovin.player.api.analytics.AnalyticsApi
import com.bitmovin.player.api.analytics.AnalyticsApi.Companion.analytics
import com.bitmovin.player.reactnative.converter.toAnalyticsCustomData
import com.facebook.react.bridge.*
import expo.modules.kotlin.functions.Queues
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import expo.modules.kotlin.Promise

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
                val readableMap = convertMapToReadableMap(json)
                val analytics = getAnalyticsForPlayer(playerId)
                analytics.sendCustomDataEvent(readableMap.toAnalyticsCustomData())
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
        val player = playerExpoModule?.getPlayerOrNull(playerId) ?: throw IllegalStateException("Could not find player with ID $playerId")
        return player.analytics ?: throw IllegalStateException("Analytics is disabled")
    }

    /**
     * Converts a Map<String, Any?> to ReadableMap for compatibility with legacy converter methods.
     */
    private fun convertMapToReadableMap(map: Map<String, Any?>): ReadableMap {
        val writableMap = Arguments.createMap()
        map.forEach { (key, value) ->
            when (value) {
                is String -> writableMap.putString(key, value)
                is Int -> writableMap.putInt(key, value)
                is Double -> writableMap.putDouble(key, value)
                is Boolean -> writableMap.putBoolean(key, value)
                is Map<*, *> -> writableMap.putMap(key, convertMapToReadableMap(value as Map<String, Any?>))
                is List<*> -> {
                    val array = Arguments.createArray()
                    value.forEach { item ->
                        when (item) {
                            is String -> array.pushString(item)
                            is Int -> array.pushInt(item)
                            is Double -> array.pushDouble(item)
                            is Boolean -> array.pushBoolean(item)
                            is Map<*, *> -> array.pushMap(convertMapToReadableMap(item as Map<String, Any?>))
                        }
                    }
                    writableMap.putArray(key, array)
                }
                null -> writableMap.putNull(key)
            }
        }
        return writableMap
    }

    companion object {
        /**
         * Static access method to maintain compatibility with other modules.
         */
        @JvmStatic
        fun getPlayerAnalytics(playerId: String): AnalyticsApi? {
            // TODO: Implement global registry pattern if needed by other modules
            return null
        }
    }
}