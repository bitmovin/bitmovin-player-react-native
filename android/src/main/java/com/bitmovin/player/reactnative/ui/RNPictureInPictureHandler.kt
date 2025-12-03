package com.bitmovin.player.reactnative.ui

import android.app.Activity
import android.app.PictureInPictureParams
import android.os.Build
import android.util.Log
import android.util.Rational
import androidx.annotation.RequiresApi
import com.bitmovin.player.api.Player
import com.bitmovin.player.reactnative.PictureInPictureAction
import com.bitmovin.player.ui.DefaultPictureInPictureHandler

private const val TAG = "RNPiPHandler"

@RequiresApi(Build.VERSION_CODES.O)
class RNPictureInPictureHandler(
    private val activity: Activity,
    private val player: Player,
) : DefaultPictureInPictureHandler(activity, player) {
    private val pictureInPictureActionHandler = DefaultPictureInPictureActionHandler(
        activity,
        player,
        ::updatePictureInPictureActions,
    )

    // Current PiP implementation on the native side requires playerView.exitPictureInPicture() to be called
    // for `PictureInPictureExit` event to be emitted.
    // Additionally, the event is only emitted if `isPictureInPicture` is true. At the point in time we call
    // playerView.exitPictureInPicture() the activity will already have exited the PiP mode,
    // and thus the event won't be emitted. To work around this we keep track of the PiP state ourselves.
    private var _isPictureInPicture = false

    override val isPictureInPicture: Boolean
        get() = _isPictureInPicture

    fun updateActions(actions: List<PictureInPictureAction>) {
        pictureInPictureActionHandler.updatePictureInPictureActions(actions)
    }

    override fun enterPictureInPicture() {
        if (!isPictureInPictureAvailable) {
            Log.w(TAG, "Calling enterPictureInPicture without PiP support.")
            return
        }

        if (isPictureInPicture) {
            return
        }

        activity.enterPictureInPictureMode(buildPictureInPictureParams())
        _isPictureInPicture = true
    }

    override fun exitPictureInPicture() {
        super.exitPictureInPicture()
        _isPictureInPicture = false
    }

    private fun buildPictureInPictureParams(): PictureInPictureParams {
        // The default implementation doesn't properly handle the case where source isn't loaded yet.
        // To work around it we just use a 16:9 aspect ratio if we cannot calculate it from `playbackVideoData`.
        val aspectRatio = player.playbackVideoData
            ?.let { Rational(it.width, it.height) }
            ?: Rational(16, 9)

        return PictureInPictureParams.Builder()
            .setAspectRatio(aspectRatio)
            .setActions(pictureInPictureActionHandler.buildRemoteActions())
            .build()
    }

    private fun updatePictureInPictureActions() {
        activity.setPictureInPictureParams(buildPictureInPictureParams())
    }

    fun dispose() {
        pictureInPictureActionHandler.dispose()
    }
}
