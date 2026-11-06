package com.bitmovin.player.reactnative

import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.content.ServiceConnection
import android.os.IBinder
import com.bitmovin.player.api.Player
import com.bitmovin.player.reactnative.services.MediaSessionPlaybackService
import expo.modules.kotlin.AppContext

/** Keeps the selected player connected to Android's single media-session service. */
class MediaSessionPlaybackManager(private val appContext: AppContext) {
    private var serviceBinder: MediaSessionPlaybackService.ServiceBinder? = null
    private var serviceConnection: ServiceConnection? = null
    private var boundContext: Context? = null
    private var selectedPlayer: Player? = null
    val player: Player?
        get() = serviceBinder?.player

    fun setupMediaSessionPlayback(player: Player) {
        selectedPlayer = player
        serviceBinder?.let {
            it.player = player
            return
        }
        if (serviceConnection != null) return
        val context = appContext.reactContext
            ?: throw IllegalStateException("React context is not available")
        val connection = object : ServiceConnection {
            override fun onServiceConnected(className: ComponentName, service: IBinder) {
                if (serviceConnection !== this) return
                val binder = service as MediaSessionPlaybackService.ServiceBinder
                serviceBinder = binder
                binder.player = selectedPlayer
            }

            override fun onServiceDisconnected(name: ComponentName) {
                if (serviceConnection === this) serviceBinder = null
            }
        }
        val intent = Intent(context, MediaSessionPlaybackService::class.java)
        intent.action = Intent.ACTION_MEDIA_BUTTON
        serviceConnection = connection
        boundContext = context
        if (!context.bindService(intent, connection, Context.BIND_AUTO_CREATE)) {
            serviceConnection = null
            boundContext = null
        }
    }

    fun destroy(player: Player) {
        if (selectedPlayer !== player) return
        selectedPlayer = null
        serviceBinder?.player = null
        serviceBinder = null
        serviceConnection?.let { connection -> boundContext?.unbindService(connection) }
        serviceConnection = null
        boundContext = null
    }
}
