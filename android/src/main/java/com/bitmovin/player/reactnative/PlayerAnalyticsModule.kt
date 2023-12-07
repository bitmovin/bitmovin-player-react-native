package com.bitmovin.player.reactnative

import com.bitmovin.player.api.analytics.AnalyticsApi
import com.bitmovin.player.api.analytics.AnalyticsApi.Companion.analytics
import com.bitmovin.player.reactnative.converter.toAnalyticsCustomData
import com.bitmovin.player.reactnative.extensions.playerModule
import com.facebook.react.bridge.*
import com.facebook.react.module.annotations.ReactModule

private const val MODULE_NAME = "PlayerAnalyticsModule"

@ReactModule(name = MODULE_NAME)
class PlayerAnalyticsModule(context: ReactApplicationContext) : BitmovinBaseModule(context) {
    /**
     * JS exported module name.
     */
    override fun getName() = MODULE_NAME

    /**
     * Sends a sample with the provided custom data.
     * Does not change the configured custom data of the collector or source.
     * @param playerId Native Id of the player instance.
     * @param json Custom data config json.
     */
    @ReactMethod
    fun sendCustomDataEvent(playerId: NativeId, json: ReadableMap, promise: Promise) {
        promise.unit.resolveOnUiThreadWithAnalytics(playerId) {
            sendCustomDataEvent(json.toAnalyticsCustomData())
        }
    }

    /**
     * Gets the current user Id for a player instance with analytics.
     * @param playerId Native Id of the the player instance.
     * @param promise JS promise object.
     */
    @ReactMethod
    fun getUserId(playerId: NativeId, promise: Promise) {
        promise.string.resolveOnUiThreadWithAnalytics(playerId) {
            userId
        }
    }

    private inline fun <T> TPromise<T>.resolveOnUiThreadWithAnalytics(
        playerId: NativeId,
        crossinline block: AnalyticsApi.() -> T,
    ) = resolveOnUiThread {
        val analytics = context.playerModule.getPlayer(playerId).analytics
            ?: throw IllegalStateException("Analytics is disabled for player $playerId")
        analytics.block()
    }
}
