package com.bitmovin.player.reactnative

import android.os.Handler
import android.os.Looper
import com.bitmovin.analytics.api.DefaultMetadata
import com.bitmovin.player.api.Player
import com.bitmovin.player.api.PlayerConfig
import com.bitmovin.player.api.advertising.AdvertisingConfig
import com.bitmovin.player.api.analytics.create
import com.bitmovin.player.reactnative.converter.toAnalyticsConfig
import com.bitmovin.player.reactnative.converter.toAnalyticsDefaultMetadata
import com.bitmovin.player.reactnative.converter.toJson
import com.bitmovin.player.reactnative.converter.toMediaControlConfig
import com.bitmovin.player.reactnative.converter.toPlayerConfig
import com.bitmovin.player.reactnative.extensions.getMap
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.jni.JavaScriptFunction
import expo.modules.kotlin.sharedobjects.SharedObject
import java.util.concurrent.atomic.AtomicBoolean

/** Owns one configured SDK player. Views retain this object, never the reverse. */
class SharedPlayer private constructor(
    appContext: AppContext,
    private var resource: Player?,
    private val callbacks: CallbackScope,
    val mediaSessionPlaybackManager: MediaSessionPlaybackManager,
) : SharedObject(appContext) {
    private val closed = AtomicBoolean(false)
    val player: Player?
        get() = if (closed.get()) null else resource

    fun destroy() {
        if (!closed.compareAndSet(false, true)) return
        callbacks.close()
        val cleanup = Runnable {
            val releasedPlayer = resource
            resource = null
            releasedPlayer?.let {
                try {
                    mediaSessionPlaybackManager.destroy(it)
                } finally {
                    it.destroy()
                }
            }
        }
        if (Looper.myLooper() == Looper.getMainLooper()) {
            cleanup.run()
        } else {
            Handler(Looper.getMainLooper()).post(
                cleanup,
            )
        }
    }

    override fun sharedObjectDidRelease() = destroy()

    companion object {
        fun empty(appContext: AppContext, manager: MediaSessionPlaybackManager) =
            SharedPlayer(appContext, null, CallbackScope(appContext, null), manager)

        fun create(
            appContext: AppContext,
            config: Map<String, Any>?,
            analytics: Map<String, Any>?,
            network: SharedNetwork?,
            decoder: SharedDecoder?,
            callback: JavaScriptFunction<Any?>?,
            manager: MediaSessionPlaybackManager,
        ): SharedPlayer {
            val callbacks = CallbackScope(appContext, callback)
            try {
                val playerConfig = config?.toPlayerConfig() ?: PlayerConfig()
                val advertising = config?.getMap("advertisingConfig")
                var advertisingConfig = playerConfig.advertisingConfig ?: AdvertisingConfig()
                if (advertising?.containsKey("shouldLoadAdItem") == true) {
                    advertisingConfig = advertisingConfig.copy(
                        shouldLoadAdItem = {
                            callbacks.call("shouldLoadAdItem", listOf(it.toJson()), 250) as? Boolean ?: true
                        },
                    )
                }
                if (advertising?.containsKey("shouldPlayAdBreak") == true) {
                    advertisingConfig = advertisingConfig.copy(
                        shouldPlayAdBreak = {
                            callbacks.call("shouldPlayAdBreak", listOf(it.toJson()), 250) as? Boolean ?: true
                        },
                    )
                }
                if (advertising != null) playerConfig.advertisingConfig = advertisingConfig
                @Suppress("UNCHECKED_CAST")
                ImaBeforeInitializationConfigurator.configure(config as? Map<String, Any?>, playerConfig, callbacks)
                network?.let { playerConfig.networkConfig = it.config }
                decoder?.let {
                    playerConfig.playbackConfig = playerConfig.playbackConfig.copy(decoderConfig = it.config)
                }
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
                return owner
            } catch (error: Throwable) {
                callbacks.close()
                throw error
            }
        }
    }
}
