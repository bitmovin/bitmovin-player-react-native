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
    private lateinit var playerId: NativeId
    internal var serviceBinder: MediaSessionPlaybackService.ServiceBinder? = null

    inner class MediaSessionPlaybackServiceConnection : ServiceConnection {
        override fun onServiceConnected(className: ComponentName, service: IBinder) {
            val binder = service as MediaSessionPlaybackService.ServiceBinder
            serviceBinder = binder
            binder.player = getPlayer()
        }

        override fun onServiceDisconnected(name: ComponentName) {
            serviceBinder?.player = null
        }
    }

    fun setupMediaSessionPlayback(playerId: NativeId) {
        this.playerId = playerId

        val intent = Intent(context, MediaSessionPlaybackService::class.java)
        intent.action = Intent.ACTION_MEDIA_BUTTON
        val connection: ServiceConnection = MediaSessionPlaybackServiceConnection()
        context.bindService(intent, connection, Context.BIND_AUTO_CREATE)
    }

    private fun getPlayer(
        nativeId: NativeId = playerId,
        playerModule: PlayerModule? = context.playerModule,
    ): Player = playerModule?.getPlayerOrNull(nativeId) ?: throw IllegalArgumentException("Invalid PlayerId $nativeId")
}
