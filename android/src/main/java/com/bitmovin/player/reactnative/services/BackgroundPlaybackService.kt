package com.bitmovin.player.reactnative.services

import android.content.Intent
import android.os.Binder
import android.os.IBinder
import com.bitmovin.player.api.Player
import com.bitmovin.player.api.media.session.MediaSession
import com.bitmovin.player.api.media.session.MediaSessionService

class BackgroundPlaybackContext(var player: Player, var provideLockScreenControls: Boolean)

class BackgroundPlaybackService : MediaSessionService() {
    inner class ServiceBinder : Binder() {
        var context: BackgroundPlaybackContext?
            get() = this@BackgroundPlaybackService.playbackContext
            set(value) {
                disconnectSession()
                this@BackgroundPlaybackService.playbackContext = value
                value?.let {
                    if (it.provideLockScreenControls) {
                        createSession(it.player)
                        connectSession()
                    }
                }
            }
    }

    private var playbackContext: BackgroundPlaybackContext? = null
    private val binder = ServiceBinder()
    private var mediaSession: MediaSession? = null

    override fun onGetSession(): MediaSession? = null

    override fun onDestroy() {
        disconnectSession()
        playbackContext = null

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
