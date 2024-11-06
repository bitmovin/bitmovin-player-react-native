package com.bitmovin.player.reactnative

import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.content.ServiceConnection
import android.os.IBinder
import com.bitmovin.player.api.Player
import com.bitmovin.player.reactnative.extensions.playerModule
import com.bitmovin.player.reactnative.services.MediaSessionPlaybackService
import com.facebook.react.bridge.*

class MediaSessionPlaybackManager(val context: ReactApplicationContext) {
    private var serviceBinder: MediaSessionPlaybackService.ServiceBinder? = null
    private lateinit var playerId: NativeId
    val player: Player?
        get() = serviceBinder?.player

    inner class MediaSessionPlaybackServiceConnection : ServiceConnection {
        override fun onServiceConnected(className: ComponentName, service: IBinder) {
            val binder = service as MediaSessionPlaybackService.ServiceBinder
            serviceBinder = binder
            binder.player = getPlayer()
        }

        override fun onServiceDisconnected(name: ComponentName) {
            destroy(playerId)
        }
    }

    fun setupMediaSessionPlayback(playerId: NativeId) {
        this.playerId = playerId

        val intent = Intent(context, MediaSessionPlaybackService::class.java)
        intent.action = Intent.ACTION_MEDIA_BUTTON
        val connection: ServiceConnection = MediaSessionPlaybackServiceConnection()
        context.bindService(intent, connection, Context.BIND_AUTO_CREATE)
    }

    fun destroy(nativeId: NativeId) {
        if (nativeId != playerId) { return }
        serviceBinder?.player = null
        serviceBinder = null
    }

    private fun getPlayer(
        nativeId: NativeId = playerId,
        playerModule: PlayerModule? = context.playerModule,
    ): Player = playerModule?.getPlayerOrNull(nativeId) ?: throw IllegalArgumentException("Invalid PlayerId $nativeId")
}
