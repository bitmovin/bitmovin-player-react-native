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
    var autoEnterEnabledOverride = false
        set(value) {
            if (autoEnterEnabledOverride == value) {
                return
            }
            field = value
            updatePictureInPictureParams()
        }

    override val isPictureInPicture: Boolean
        get() = _isPictureInPicture

    init {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            updatePictureInPictureParams()

            player.on<PlayerEvent.VideoPlaybackQualityChanged> {
                updatePictureInPictureParams()
            }
        }
    }

    private fun getPiPAspectRation() = player.playbackVideoData
        ?.let { Rational(it.width, it.height) }
        ?: Rational(16, 9)


    @RequiresApi(Build.VERSION_CODES.O)
    private fun buildPictureInPictureParams(autoEnterEnabled: Boolean = autoEnterEnabledOverride) =
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
