package com.bitmovin.player.reactnative.ui

import android.app.Activity
import android.app.PictureInPictureParams
import android.os.Build
import android.util.Log
import android.util.Rational
import androidx.annotation.RequiresApi
import com.bitmovin.player.api.Player
import com.bitmovin.player.api.event.PlayerEvent
import com.bitmovin.player.api.event.on
import com.bitmovin.player.ui.DefaultPictureInPictureHandler
import com.bitmovin.player.reactnative.PictureInPictureConfig

private const val TAG = "RNPiPHandler"

class RNPictureInPictureHandler(
    private val activity: Activity,
    private val player: Player,
    private val pictureInPictureConfig: PictureInPictureConfig,
) : DefaultPictureInPictureHandler(activity, player) {
    // Current PiP implementation on the native side requires playerView.exitPictureInPicture() to be called
    // for `PictureInPictureExit` event to be emitted.
    // Additionally, the event is only emitted if `isPictureInPicture` is true. At the point in time we call
    // playerView.exitPictureInPicture() the activity will already have exited the PiP mode,
    // and thus the event won't be emitted. To work around this we keep track of the PiP state ourselves.
    private var _isPictureInPicture = false
    var playerIsPlaying = false
        private set(value) {
            if (field == value) {
                return
            }
            field = value
            updatePictureInPictureParams()
        }

    override val isPictureInPicture: Boolean
        get() = _isPictureInPicture

    init {
        playerIsPlaying = player.isPlaying
        subscribeToPlayerPlaybackEvents()
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            updatePictureInPictureParams()

            player.on<PlayerEvent.VideoPlaybackQualityChanged> {
                updatePictureInPictureParams()
            }
        }
    }

    private val setPlayerIsPlaying: (PlayerEvent) -> Unit = {
        playerIsPlaying = true
    }

    private val setPlayerIsNotPlaying: (PlayerEvent) -> Unit = {
        playerIsPlaying = true
    }

    private fun subscribeToPlayerPlaybackEvents() {
        player.on<PlayerEvent.Play>(setPlayerIsPlaying)
        player.on<PlayerEvent.Playing>(setPlayerIsPlaying)
        player.on<PlayerEvent.AdBreakStarted>(setPlayerIsPlaying)
        player.on<PlayerEvent.Paused>(setPlayerIsNotPlaying)
        player.on<PlayerEvent.PlaybackFinished>(setPlayerIsNotPlaying)
        player.on<PlayerEvent.Inactive>(setPlayerIsNotPlaying)
        player.on<PlayerEvent.Destroy>(setPlayerIsNotPlaying)
        player.on<PlayerEvent.Error>(setPlayerIsNotPlaying)
        player.on<PlayerEvent.AdBreakFinished>(setPlayerIsNotPlaying)
    }

    private fun getPiPAspectRation() = player.playbackVideoData
        ?.let { Rational(it.width, it.height) }
        ?: Rational(16, 9)


    @RequiresApi(Build.VERSION_CODES.O)
    private fun buildPictureInPictureParams(
        autoEnterEnabled: Boolean = pictureInPictureConfig.isAutoPipEnabled && playerIsPlaying
    ) =
        PictureInPictureParams.Builder()
            .setAspectRatio(getPiPAspectRation())
            .apply {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                    setAutoEnterEnabled(autoEnterEnabled)
                }
            }
            .build()

    private fun updatePictureInPictureParams() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) {
            return
        }
        activity.setPictureInPictureParams(buildPictureInPictureParams())
    }

    @RequiresApi(Build.VERSION_CODES.O)
    override fun enterPictureInPicture() {
        if (!isPictureInPictureAvailable) {
            Log.w(TAG, "Calling enterPictureInPicture without PiP support.")
            return
        }

        if (isPictureInPicture) {
            return
        }

        val params = buildPictureInPictureParams()

        activity.enterPictureInPictureMode(params)
        _isPictureInPicture = true
    }

    override fun exitPictureInPicture() {
        super.exitPictureInPicture()
        _isPictureInPicture = false
    }
}


private val PictureInPictureConfig.isAutoPipEnabled get() = isEnabled && shouldEnterOnBackground
