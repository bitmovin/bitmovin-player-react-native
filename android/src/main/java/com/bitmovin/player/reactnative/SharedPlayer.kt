package com.bitmovin.player.reactnative

import com.bitmovin.analytics.api.DefaultMetadata
import com.bitmovin.player.api.Player
import com.bitmovin.player.api.PlayerConfig
import com.bitmovin.player.api.advertising.AdvertisingConfig
import com.bitmovin.player.api.analytics.create
import com.bitmovin.player.reactnative.converter.toAnalyticsConfig
import com.bitmovin.player.reactnative.converter.toAnalyticsDefaultMetadata
import com.bitmovin.player.reactnative.converter.toDecoderConfig
import com.bitmovin.player.reactnative.converter.toJson
import com.bitmovin.player.reactnative.converter.toMediaControlConfig
import com.bitmovin.player.reactnative.converter.toNetworkConfig
import com.bitmovin.player.reactnative.converter.toPlayerConfig
import com.bitmovin.player.reactnative.extensions.getMap
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.jni.JavaScriptFunction
import expo.modules.kotlin.jni.JavaScriptValue
import expo.modules.kotlin.sharedobjects.SharedRef
import kotlinx.coroutines.Dispatchers
import kotlin.coroutines.EmptyCoroutineContext

/** Owns one configured SDK player. Views retain this object, never the reverse. */
class SharedPlayer private constructor(
    appContext: AppContext,
    player: Player,
    private val callbacks: CallbackScope,
    val mediaSessionPlaybackManager: MediaSessionPlaybackManager,
) : SharedRef<Player>(player, appContext) {
    val player: Player
        get() = ref

    fun destroy() {
        callbacks.close()
        try {
            mediaSessionPlaybackManager.destroy(player)
        } finally {
            if (!player.isDestroyed) player.destroy()
        }
    }

    override fun sharedObjectDidRelease() {
        callbacks.close()
        Dispatchers.Main.dispatch(EmptyCoroutineContext) { destroy() }
    }

    companion object {
        fun create(
            appContext: AppContext,
            config: Map<String, Any>?,
            analytics: Map<String, Any>?,
            callback: JavaScriptFunction<JavaScriptValue>?,
            manager: MediaSessionPlaybackManager,
        ): SharedPlayer {
            val callbacks = CallbackScope(appContext, callback)
            return callbacks.createSharedObject {
                val playerConfig = preparePlayerConfig(config, callbacks)
                val context = requireNotNull(appContext.reactContext?.applicationContext) {
                    "Application context is not available"
                }
                val player = analytics?.toAnalyticsConfig()?.let {
                    Player.create(
                        context,
                        playerConfig,
                        it,
                        analytics.getMap("defaultMetadata")?.toAnalyticsDefaultMetadata() ?: DefaultMetadata(),
                    )
                } ?: Player.create(context, playerConfig)
                val owner = SharedPlayer(appContext, player, callbacks, manager)
                try {
                    if (config?.getMap("mediaControlConfig")?.toMediaControlConfig()?.isEnabled != false) {
                        manager.setupMediaSessionPlayback(player)
                    }
                } catch (error: Throwable) {
                    owner.destroy()
                    throw error
                }
                owner
            }
        }
    }
}

private fun preparePlayerConfig(
    config: Map<String, Any>?,
    callbacks: CallbackScope,
): PlayerConfig {
    val playerConfig = config?.toPlayerConfig() ?: PlayerConfig()
    val advertising = config?.getMap("advertisingConfig")
    var advertisingConfig = playerConfig.advertisingConfig ?: AdvertisingConfig()
    if (advertising?.containsKey("shouldLoadAdItem") == true) {
        advertisingConfig = advertisingConfig.copy(
            shouldLoadAdItem = {
                callbacks.call("advertisingConfig.shouldLoadAdItem", listOf(it.toJson()), 250) as? Boolean ?: true
            },
        )
    }
    if (advertising?.containsKey("shouldPlayAdBreak") == true) {
        advertisingConfig = advertisingConfig.copy(
            shouldPlayAdBreak = {
                callbacks.call("advertisingConfig.shouldPlayAdBreak", listOf(it.toJson()), 250) as? Boolean ?: true
            },
        )
    }
    if (advertising != null) playerConfig.advertisingConfig = advertisingConfig
    @Suppress("UNCHECKED_CAST")
    ImaBeforeInitializationConfigurator.configure(config as? Map<String, Any?>, playerConfig, callbacks)
    config?.getMap("networkConfig")?.let { playerConfig.networkConfig = it.toNetworkConfig(callbacks) }
    config?.getMap("playbackConfig")?.getMap("decoderConfig").toDecoderConfig(callbacks)?.let {
        playerConfig.playbackConfig = playerConfig.playbackConfig.copy(decoderConfig = it)
    }
    return playerConfig
}
