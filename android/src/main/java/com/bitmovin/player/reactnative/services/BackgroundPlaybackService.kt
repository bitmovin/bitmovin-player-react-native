package com.bitmovin.player.reactnative.services

import android.app.Service
import android.content.Intent
import android.os.IBinder
import com.bitmovin.player.api.Player
import com.bitmovin.player.reactnative.PlayerServiceBinder

class BackgroundPlaybackService : Service() {
    inner class ServiceBinder(player: Player?) : PlayerServiceBinder(player) {
        override var player: Player?
            get() = this@BackgroundPlaybackService.player
            set(value) {
                this@BackgroundPlaybackService.player?.destroy()
                this@BackgroundPlaybackService.player = value
            }
    }

    private var player: Player? = null
    private val binder = ServiceBinder(player)

    override fun onDestroy() {
        player?.destroy()
        player = null

        super.onDestroy()
    }

    override fun onBind(intent: Intent?): IBinder {
        return binder
    }
}
