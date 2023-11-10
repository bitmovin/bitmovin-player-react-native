package com.bitmovin.player.reactnative

import com.bitmovin.player.api.analytics.AnalyticsApi.Companion.analytics
import com.bitmovin.player.reactnative.converter.toAnalyticsCustomData
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
     * @param nativeId Native Id of the collector instance.
     * @param json Custom data config json.
     */
    @ReactMethod
    fun sendCustomDataEvent(nativeId: NativeId, json: ReadableMap?, promise: Promise) {
        addUIBlock(promise) {
            json?.toAnalyticsCustomData()?.let {
                playerModule().getPlayer(nativeId)?.analytics?.sendCustomDataEvent(it)
            }
        }
    }

    /**
     * Gets the current user Id for a player instance with analytics.
     * @param nativeId Native Id of the the player instance.
     * @param promise JS promise object.
     */
    @ReactMethod
    fun getUserId(playerId: NativeId, promise: Promise) {
        addUIBlock(promise) {
            playerModule().getPlayer(playerId)?.analytics?.let {
                promise.resolve(it.userId)
            }
        }
    }
}
