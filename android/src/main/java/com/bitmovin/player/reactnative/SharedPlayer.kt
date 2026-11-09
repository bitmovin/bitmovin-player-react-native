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
                val playerConfig = config?.toPlayerConfig(callbacks) ?: PlayerConfig()
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
