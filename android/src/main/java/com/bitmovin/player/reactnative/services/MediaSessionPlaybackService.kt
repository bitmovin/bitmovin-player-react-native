package com.bitmovin.player.reactnative.services

import android.content.Intent
import android.os.IBinder
import com.bitmovin.player.api.Player
import com.bitmovin.player.api.media.session.MediaSession
import com.bitmovin.player.api.media.session.MediaSessionService
import com.bitmovin.player.reactnative.PlayerServiceBinder

class MediaSessionPlaybackService : MediaSessionService() {
    inner class ServiceBinder(player: Player?) : PlayerServiceBinder(player) {
        override var player: Player?
            get() = this@MediaSessionPlaybackService.player
            set(value) {
                this@MediaSessionPlaybackService.player?.destroy()
                this@MediaSessionPlaybackService.player = value
                value?.let {
                    createMediaSession(it)
                }
            }

        fun connectSession() = mediaSession?.let { addSession(it) }
        fun disconnectSession() = mediaSession?.let {
            removeSession(it)
            it.release()
        }
    }

    private var player: Player? = null
    private val binder = ServiceBinder(player)
    private var mediaSession: MediaSession? = null

    override fun onGetSession(): MediaSession? = mediaSession

    override fun onCreate() {
        super.onCreate()
        val player = this.player ?: Player(this)

        mediaSession = MediaSession(
            this,
            mainLooper,
            player,
        )
    }

    override fun onDestroy() {
        binder.disconnectSession()

        player?.destroy()
        player = null

        super.onDestroy()
    }

    override fun onBind(intent: Intent?): IBinder {
        super.onBind(intent)
        return binder
    }

    private fun createMediaSession(player: Player) {
        binder.disconnectSession()

        val newMediaSession = MediaSession(
            this,
            mainLooper,
            player,
        )

        mediaSession = newMediaSession
        binder.connectSession()
    }
}