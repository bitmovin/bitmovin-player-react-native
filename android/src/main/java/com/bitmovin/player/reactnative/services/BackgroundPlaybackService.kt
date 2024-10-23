package com.bitmovin.player.reactnative.services

import android.app.Service
import android.content.Intent
import android.os.Binder
import android.os.IBinder
import com.bitmovin.player.api.Player

class BackgroundPlaybackService : Service() {
    inner class ServiceBinder : Binder() {
        var player: Player?
            get() = this@BackgroundPlaybackService.player
            set(value) {
                this@BackgroundPlaybackService.player?.destroy()
                this@BackgroundPlaybackService.player = value
            }
    }

    private val binder = ServiceBinder()
    private var player: Player? = null

    override fun onCreate() {
        super.onCreate()
        val player = this.player ?: Player(this)
    }

    override fun onDestroy() {
        player?.destroy()
        player = null

        super.onDestroy()
    }

    override fun onBind(intent: Intent?): IBinder {
//        super.onBind(intent)
        return binder
    }
}