package com.bitmovin.player.reactnative

import com.bitmovin.analytics.api.DefaultMetadata
import com.bitmovin.player.api.Player
import com.bitmovin.player.api.PlayerConfig
import com.bitmovin.player.api.analytics.create
import com.bitmovin.player.reactnative.converter.toAnalyticsConfig
import com.bitmovin.player.reactnative.converter.toAnalyticsDefaultMetadata
import com.bitmovin.player.reactnative.converter.toMediaControlConfig
import com.bitmovin.player.reactnative.converter.toPlayerConfig
import com.bitmovin.player.reactnative.extensions.getMap
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.jni.JavaScriptObject
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.sharedobjects.SharedObject
import kotlinx.coroutines.Dispatchers
import kotlin.coroutines.EmptyCoroutineContext

/** Owns one configured SDK player. Views retain this object, never the reverse. */
class SharedPlayer private constructor(
    appContext: AppContext,
    factory: () -> Player,
    private val callbacks: JavaScriptCallbacks,
    val mediaSessionPlaybackManager: MediaSessionPlaybackManager,
) : SharedObject(appContext) {
    private var isDestroyed = false
    private val playerDelegate = lazy {
        check(!isDestroyed) { "Destroyed before SDK creation" }
        factory().also { observePlayerEvents(it) }
    }

    val player: Player by playerDelegate

    fun destroy() {
        callbacks.close()
        if (isDestroyed) return
        isDestroyed = true
        if (!playerDelegate.isInitialized()) return
        try {
            mediaSessionPlaybackManager.destroy(player)
        } finally {
            player.destroy()
        }
    }

    override fun sharedObjectDidRelease() {
        callbacks.close()
        Dispatchers.Main.dispatch(EmptyCoroutineContext) {
            if (!isDestroyed) destroy()
        }
    }

    companion object {
        fun create(
            appContext: AppContext,
            config: JavaScriptObject?,
            analytics: Map<String, Any>?,
            module: Module,
            manager: MediaSessionPlaybackManager,
        ): SharedPlayer {
            val callbacks = JavaScriptCallbacks(appContext, module)
            val nativeConfig = callbacks.snapshot(config, captureAdvertising = true)
            fun createSdkPlayer(): Player {
                val playerConfig = nativeConfig?.toPlayerConfig() ?: PlayerConfig()
                val context = checkNotNull(appContext.reactContext?.applicationContext) {
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
                try {
                    if (nativeConfig?.getMap("mediaControlConfig")?.toMediaControlConfig()?.isEnabled != false) {
                        manager.setupMediaSessionPlayback(player)
                    }
                } catch (error: Throwable) {
                    player.destroy()
                    throw error
                }
                return player
            }
            return SharedPlayer(appContext, ::createSdkPlayer, callbacks, manager)
        }
    }
}
