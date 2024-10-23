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
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow

class BackgroundPlaybackConnectionManager(val context: ReactApplicationContext) {
    private var isServiceStarted = false
    private lateinit var playerId: NativeId

    private val _serviceBinder = MutableStateFlow<BackgroundPlaybackService.ServiceBinder?>(null)
    val serviceBinder = _serviceBinder.asStateFlow()

    inner class BackgroundPlaybackConnection : ServiceConnection {
        override fun onServiceConnected(className: ComponentName, service: IBinder) {
            // We've bound to the Service, cast the IBinder and get the Player instance
            val binder = service as BackgroundPlaybackService.ServiceBinder
            _serviceBinder.value = binder
            binder.player = getPlayer()
        }

        override fun onServiceDisconnected(name: ComponentName) {
            _serviceBinder.value?.player = null
        }
    }

    fun setupBackgroundPlayback(playerId: NativeId) {
        this@BackgroundPlaybackConnectionManager.playerId = playerId
        val intent = Intent(context, BackgroundPlaybackService::class.java)
        intent.action = Intent.ACTION_MEDIA_BUTTON

        val connection = BackgroundPlaybackConnection()
        context.bindService(intent, connection, Context.BIND_AUTO_CREATE)

        if (!isServiceStarted) {
            context.startService(intent)
            isServiceStarted = true
        }
    }

    private fun getPlayer(
        nativeId: NativeId = playerId,
        playerModule: PlayerModule? = context.playerModule,
    ): Player = playerModule?.getPlayerOrNull(nativeId) ?: throw IllegalArgumentException("Invalid PlayerId $nativeId")
}
