package com.bitmovin.player.reactnative

import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.content.ServiceConnection
import android.os.IBinder
import com.bitmovin.player.api.Player
import com.bitmovin.player.reactnative.extensions.playerModule
import com.bitmovin.player.reactnative.services.BackgroundPlaybackService
import com.facebook.react.bridge.*

class BackgroundPlaybackManager(val context: ReactApplicationContext) {
    private lateinit var playerId: NativeId
    internal var serviceBinder: BackgroundPlaybackService.ServiceBinder? = null

    inner class BackgroundPlaybackServiceConnection : ServiceConnection {
        override fun onServiceConnected(className: ComponentName, service: IBinder) {
            val binder = service as BackgroundPlaybackService.ServiceBinder
            serviceBinder = binder
            binder.player = getPlayer()
        }

        override fun onServiceDisconnected(name: ComponentName) {
            serviceBinder?.player = null
        }
    }

    fun setupBackgroundPlayback(playerId: NativeId) {
        this.playerId = playerId

        val intent = Intent(context, BackgroundPlaybackService::class.java)
        intent.action = Intent.ACTION_MEDIA_BUTTON
        val connection: ServiceConnection = BackgroundPlaybackServiceConnection()
        context.bindService(intent, connection, Context.BIND_AUTO_CREATE)
    }

    private fun getPlayer(
        nativeId: NativeId = playerId,
        playerModule: PlayerModule? = context.playerModule,
    ): Player = playerModule?.getPlayerOrNull(nativeId) ?: throw IllegalArgumentException("Invalid PlayerId $nativeId")
}
