package com.bitmovin.player.reactnative

import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.content.ServiceConnection
import android.os.Binder
import android.os.IBinder
import com.bitmovin.player.api.Player
import com.bitmovin.player.reactnative.extensions.playerModule
import com.bitmovin.player.reactnative.services.BackgroundPlaybackService
import com.bitmovin.player.reactnative.services.MediaSessionPlaybackService
import com.facebook.react.bridge.*
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow

class BackgroundPlaybackManager(val context: ReactApplicationContext) {
    private var isServiceStarted = false
    private lateinit var playerId: NativeId

    private val _serviceBinder = MutableStateFlow<PlayerServiceBinder?>(null)
    val serviceBinder = _serviceBinder.asStateFlow()

    inner class BackgroundPlaybackServiceConnection : ServiceConnection {
        override fun onServiceConnected(className: ComponentName, service: IBinder) {
            val binder = service as PlayerServiceBinder
            _serviceBinder.value = binder
            binder.player = getPlayer()
        }

        override fun onServiceDisconnected(name: ComponentName) {
            _serviceBinder.value?.player = null
        }
    }

    fun setupBackgroundPlayback(playerId: NativeId, playerModule: PlayerModule) {
        this@BackgroundPlaybackManager.playerId = playerId
        val serviceClass = if (playerModule.isMediaSessionPlaybackEnabled) {
            MediaSessionPlaybackService::class.java
        } else {
            BackgroundPlaybackService::class.java
        }
//        val serviceClass = MediaSessionPlaybackService::class.java
        val intent = Intent(context, serviceClass)
        intent.action = Intent.ACTION_MEDIA_BUTTON
        val connection: ServiceConnection = BackgroundPlaybackServiceConnection()
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

open class PlayerServiceBinder(open var player: Player?) : Binder()
