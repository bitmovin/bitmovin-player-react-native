package com.bitmovin.player.reactnative.services

import android.content.Intent
import android.os.Binder
import android.os.IBinder
import com.bitmovin.player.api.Player
import com.bitmovin.player.api.media.session.ControllerInfo
import com.bitmovin.player.api.media.session.MediaSession
import com.bitmovin.player.api.media.session.MediaSessionService

class MediaSessionPlaybackService : MediaSessionService() {
    inner class ServiceBinder : Binder() {
        var player: Player?
            get() = this@MediaSessionPlaybackService.player
            set(value) {
                if (player == value) {
                    return
                }

                disconnectSession()
                this@MediaSessionPlaybackService.player = value
                value?.let {
                    createSession(it)
                    connectSession()
                }
            }
    }

    private var player: Player? = null
    private val binder = ServiceBinder()
    private var mediaSession: MediaSession? = null

    override fun onGetSession(controllerInfo: ControllerInfo) = null

    override fun onDestroy() {
        disconnectSession()
        player = null

        super.onDestroy()
    }

    override fun onBind(intent: Intent?): IBinder {
        super.onBind(intent)
        return binder
    }

    private fun createSession(player: Player) {
        mediaSession = MediaSession(
            this,
            mainLooper,
            player,
        )
    }

    private fun connectSession() = mediaSession?.let { addSession(it) }
    private fun disconnectSession() = mediaSession?.let {
        removeSession(it)
        it.release()
    }
}
