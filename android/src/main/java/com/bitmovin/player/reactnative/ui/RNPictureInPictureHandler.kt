package com.bitmovin.player.reactnative.ui

import android.app.Activity
import android.app.PendingIntent
import android.app.PictureInPictureParams
import android.app.RemoteAction
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.graphics.drawable.Icon
import android.os.Build
import android.util.Log
import android.util.Rational
import androidx.annotation.RequiresApi
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat
import com.bitmovin.player.api.Player
import com.bitmovin.player.reactnative.PictureInPictureAction
import com.bitmovin.player.reactnative.R
import com.bitmovin.player.ui.DefaultPictureInPictureHandler

private const val TAG = "RNPiPHandler"
private const val SEEK_INTERVAL_SECONDS = 10.0
private const val REQUEST_CODE_PLAY_PAUSE = 100
private const val REQUEST_CODE_SEEK_BACKWARD = 101
private const val REQUEST_CODE_SEEK_FORWARD = 102
private const val ACTION_PLAY_PAUSE =
    "com.bitmovin.player.reactnative.ui.pictureinpicture.PLAY_PAUSE"
private const val ACTION_SEEK_FORWARD =
    "com.bitmovin.player.reactnative.ui.pictureinpicture.SEEK_FORWARD"
private const val ACTION_SEEK_BACKWARD =
    "com.bitmovin.player.reactnative.ui.pictureinpicture.SEEK_BACKWARD"

class RNPictureInPictureHandler(
    private val activity: Activity,
    private val player: Player,
) : DefaultPictureInPictureHandler(activity, player) {
    // Current PiP implementation on the native side requires playerView.exitPictureInPicture() to be called
    // for `PictureInPictureExit` event to be emitted.
    // Additionally, the event is only emitted if `isPictureInPicture` is true. At the point in time we call
    // playerView.exitPictureInPicture() the activity will already have exited the PiP mode,
    // and thus the event won't be emitted. To work around this we keep track of the PiP state ourselves.
    private var _isPictureInPicture = false
    private val pictureInPictureActionFilter = IntentFilter().apply {
        addAction(ACTION_PLAY_PAUSE)
        addAction(ACTION_SEEK_FORWARD)
        addAction(ACTION_SEEK_BACKWARD)
    }
    private val pictureInPictureActionReceiver: BroadcastReceiver = object : BroadcastReceiver() {
        override fun onReceive(context: Context?, intent: Intent?) {
            when (intent?.action) {
                ACTION_PLAY_PAUSE -> togglePlayback()
                ACTION_SEEK_FORWARD -> seek(SEEK_INTERVAL_SECONDS)
                ACTION_SEEK_BACKWARD -> seek(-SEEK_INTERVAL_SECONDS)
                else -> return
            }

            updatePictureInPictureActions()
        }
    }
    private var actions: List<PictureInPictureAction> = emptyList()

    init {
        ActivityCompat.registerReceiver(
            activity,
            pictureInPictureActionReceiver,
            pictureInPictureActionFilter,
            ContextCompat.RECEIVER_NOT_EXPORTED,
        )
    }

    override val isPictureInPicture: Boolean
        get() = _isPictureInPicture

    fun updateActions(actions: List<PictureInPictureAction>) {
        this.actions = actions
        updatePictureInPictureActions()
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

        activity.enterPictureInPictureMode(buildPictureInPictureParams())
        _isPictureInPicture = true
    }

    override fun exitPictureInPicture() {
        super.exitPictureInPicture()
        _isPictureInPicture = false
    }

    @RequiresApi(Build.VERSION_CODES.O)
    private fun buildPictureInPictureParams(): PictureInPictureParams {
        // The default implementation doesn't properly handle the case where source isn't loaded yet.
        // To work around it we just use a 16:9 aspect ratio if we cannot calculate it from `playbackVideoData`.
        val aspectRatio = player.playbackVideoData
            ?.let { Rational(it.width, it.height) }
            ?: Rational(16, 9)

        return PictureInPictureParams.Builder()
            .setAspectRatio(aspectRatio)
            .setActions(createRemoteActions())
            .build()
    }

    private fun updatePictureInPictureActions() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) {
            return
        }

        activity.setPictureInPictureParams(buildPictureInPictureParams())
    }

    @RequiresApi(Build.VERSION_CODES.O)
    private fun createRemoteActions(): List<RemoteAction> {
        val playPauseAction = if (player.isPlaying) {
            createRemoteAction(
                R.drawable.media_pause,
                activity.getString(R.string.pip_action_pause),
                ACTION_PLAY_PAUSE,
                REQUEST_CODE_PLAY_PAUSE,
            )
        } else {
            createRemoteAction(
                R.drawable.media_play,
                activity.getString(R.string.pip_action_play),
                ACTION_PLAY_PAUSE,
                REQUEST_CODE_PLAY_PAUSE,
            )
        }

        val seekBackwardAction = createRemoteAction(
            R.drawable.media_back,
            activity.getString(R.string.pip_action_seek_backward),
            ACTION_SEEK_BACKWARD,
            REQUEST_CODE_SEEK_BACKWARD,
        )

        val seekForwardAction = createRemoteAction(
            R.drawable.media_forward,
            activity.getString(R.string.pip_action_seek_forward),
            ACTION_SEEK_FORWARD,
            REQUEST_CODE_SEEK_FORWARD,
        )

        return buildList {
            if (actions.contains(PictureInPictureAction.Seek)) {
                add(seekBackwardAction)
            }
            if (actions.contains(PictureInPictureAction.TogglePlayback)) {
                add(playPauseAction)
            }
            if (actions.contains(PictureInPictureAction.Seek)) {
                add(seekForwardAction)
            }
        }
    }

    private fun togglePlayback() {
        if (player.isPlaying) {
            player.pause()
        } else {
            player.play()
        }
    }

    private fun seek(offset: Double) {
        val targetTime = (player.currentTime + offset).coerceAtLeast(0.0)
        player.seek(targetTime)
    }

    @RequiresApi(Build.VERSION_CODES.O)
    private fun createRemoteAction(
        iconRes: Int,
        title: CharSequence,
        intentAction: String,
        requestCode: Int,
    ): RemoteAction {
        val icon = Icon.createWithResource(activity, iconRes)
        val pendingIntent = PendingIntent.getBroadcast(
            activity,
            requestCode,
            Intent(intentAction).setPackage(activity.packageName),
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
        )

        return RemoteAction(icon, title, title, pendingIntent)
    }

    fun dispose() {
        activity.unregisterReceiver(pictureInPictureActionReceiver)
    }
}
