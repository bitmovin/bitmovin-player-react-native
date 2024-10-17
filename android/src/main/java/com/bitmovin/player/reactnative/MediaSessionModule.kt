package com.bitmovin.player.reactnative


import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.content.ServiceConnection
import android.os.IBinder
import com.bitmovin.player.api.Player
import com.bitmovin.player.reactnative.extensions.playerModule
import com.bitmovin.player.reactnative.services.MediaSessionPlaybackService
import com.facebook.react.bridge.*
import com.facebook.react.module.annotations.ReactModule
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow

private const val MODULE_NAME = "MediaSessionModule"
@ReactModule(name = MODULE_NAME)
class MediaSessionModule(context: ReactApplicationContext) : BitmovinBaseModule(context) {
    override fun getName() = MODULE_NAME

    private var isServiceStarted = false
    private lateinit var playerId: NativeId

    private val _player = MutableStateFlow<Player?>(null)
    val player = _player.asStateFlow()

    private val _serviceBinder = MutableStateFlow<MediaSessionPlaybackService.ServiceBinder?>(null)
    val serviceBinder = _serviceBinder.asStateFlow()

    inner class MediaSessionServiceConnection: ServiceConnection {
        // we need a promise here, so that we can resolve it here instead of in setupMediaSession
        // subclass ServiceConnection and pass promise
        override fun onServiceConnected(className: ComponentName, service: IBinder) {
            // We've bound to the Service, cast the IBinder and get the Player instance
            val binder = service as MediaSessionPlaybackService.ServiceBinder
            _serviceBinder.value = binder
            binder.player = getPlayer()
        }

        override fun onServiceDisconnected(name: ComponentName) {
            _player.value = null
        }
    }


    // [!!!] -- on new sources, the media session does not get overridden
    // ISSUE: whenever a player instance is created the service does not get
    // updated/overridden with that instance.
    // Because in player.ts we call `setupMediaSession` on `initialize()`.
    @ReactMethod
    fun setupMediaSession(playerId: NativeId) {
        // if there is an existing media session session, change its content
        // the change should be on play actually, not on player creation

        this@MediaSessionModule.playerId = playerId
        val intent = Intent(context, MediaSessionPlaybackService::class.java)
        intent.action = Intent.ACTION_MEDIA_BUTTON

        val connection = MediaSessionServiceConnection()
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

    /// FINE
    // - add LockScreenConfig serializers
    // - add a lock-screen control sample: only there the config is set to true
    // - fix player is paused when app is minimized: see android codebase: implement Activity lfiecycle onStart and onStop and detach player
}

// ISSUE2 -- if I start playback, minimize, and restart playback. I should
//           re-fetch the state of the player from the service and update
//           the player in the view

// ISSUE3 -- if I start playback, minimize the app, the playback gets paused.
//           It should not (it is background playback)

// ISSUE4 -- if `loadSource()` is a different source than the one playing in the
//           service, load that instead.
