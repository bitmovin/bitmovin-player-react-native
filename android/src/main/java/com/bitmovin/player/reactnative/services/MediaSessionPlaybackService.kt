package com.bitmovin.player.reactnative.services

import android.content.Intent
import android.os.Binder
import android.os.IBinder
import com.bitmovin.player.api.Player
import com.bitmovin.player.api.media.session.MediaSession
import com.bitmovin.player.api.media.session.MediaSessionService
import com.bitmovin.player.reactnative.BitmovinBaseModule
import com.bitmovin.player.reactnative.NativeId
import com.facebook.react.bridge.*
import com.facebook.react.module.annotations.ReactModule

class MediaSessionPlaybackService : MediaSessionService() {
//    @ReactModule(name = "test")
//    inner class TestModule(context: ReactApplicationContext) : BitmovinBaseModule(context) {
//        override fun getName(): String {
//            // TODO: read background investigation on Confluence
//        }
//    }

    inner class ServiceBinder : Binder() {
//        lateinit var playerNativeId: NativeId

        // When the service starts, it creates a player
        // When playback activity is created, it gets a binder and
        // goes to the service and gets the player from it -- the same player instance.
        var player: Player?
            get() = this@MediaSessionPlaybackService.player
            set(value) {
                this@MediaSessionPlaybackService.player = value
                value?.let {
                    createMediaSession(it)
                }
            }

        fun connectSession() = mediaSession?.let { addSession(it) }
        fun disconnectSession() = mediaSession?.let{
            removeSession(it)
            it.release()
        }
    }

    private val binder = ServiceBinder()
    private var player: Player? = null
    private var mediaSession: MediaSession? = null

    override fun onGetSession(): MediaSession? = mediaSession

    // Player has 2 pointers: one from application, one from service
    // but is the same instance.
    // So when it loses the application one, it still does not get
    // garbage-collected because it still has a strong reference.
    override fun onCreate() {
        super.onCreate()
        // [!!] I need to get the same react-native instance of the player here
//        player = Player(this)

        // cannot create mediaSession without a player
        // TODO: call playerModule.createPlayer to actually create a player
        // so then we'll go to `mediaSessionModule.. onServiceConnected`
        mediaSession = MediaSession(
            this,
            mainLooper,
            Player(this),// use the playermodule's player here
        )
    }

    override fun onDestroy() {
        mediaSession?.release()
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

        val newMediaSession = MediaSession(// the real media session
            this,
            mainLooper,
            player,
        )

        mediaSession = newMediaSession
        binder.connectSession()
    }
}