package com.bitmovin.player.reactnative

import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.content.ServiceConnection
import android.os.IBinder
import com.bitmovin.player.api.Player
import com.bitmovin.player.reactnative.services.MediaSessionPlaybackService
import expo.modules.kotlin.AppContext

class MediaSessionPlaybackManager(val appContext: AppContext) {
    private var serviceBinder: MediaSessionPlaybackService.ServiceBinder? = null
    private var playerId: NativeId? = null
    val player: Player?
        get() = serviceBinder?.player

    inner class MediaSessionPlaybackServiceConnection : ServiceConnection {
        override fun onServiceConnected(className: ComponentName, service: IBinder) {
            val binder = service as MediaSessionPlaybackService.ServiceBinder
            serviceBinder = binder
            binder.player = getPlayer()
        }

        override fun onServiceDisconnected(name: ComponentName) {
            playerId?.let {
                destroy(it)
            }
        }
    }

    fun setupMediaSessionPlayback(playerId: NativeId) {
        this.playerId = playerId

        val context = appContext.reactContext
            ?: throw IllegalStateException("React context is not available")
        val intent = Intent(context, MediaSessionPlaybackService::class.java)
        intent.action = Intent.ACTION_MEDIA_BUTTON
        val connection: ServiceConnection = MediaSessionPlaybackServiceConnection()
        context.bindService(intent, connection, Context.BIND_AUTO_CREATE)
    }

    fun destroy(nativeId: NativeId) {
        if (nativeId != playerId) {
            return
        }
        serviceBinder?.player = null
        serviceBinder = null
    }

    private fun getPlayer(
        nativeId: NativeId? = playerId,
    ): Player = playerId?.let { appContext.registry.getModule<PlayerModule>()?.getPlayerOrNull(it) }
        ?: throw IllegalArgumentException("Invalid PlayerId $nativeId")
}
