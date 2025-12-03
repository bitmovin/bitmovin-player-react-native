package com.bitmovin.player.reactnative.ui

import android.app.Activity
import android.app.PendingIntent
import android.app.RemoteAction
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.graphics.drawable.Icon
import android.os.Build
import androidx.annotation.RequiresApi
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat
import com.bitmovin.player.api.Player
import com.bitmovin.player.reactnative.PictureInPictureAction
import com.bitmovin.player.reactnative.PictureInPictureConfig
import com.bitmovin.player.reactnative.R

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

internal interface PictureInPictureActionHandler {
    fun updatePictureInPictureActions(actions: List<PictureInPictureAction>)
    fun buildRemoteActions(): List<RemoteAction>
    fun dispose()
}

@RequiresApi(Build.VERSION_CODES.O)
internal class DefaultPictureInPictureActionHandler(
    private val activity: Activity,
    private val player: Player,
    private val updatePictureInPictureParams: () -> Unit,
) : PictureInPictureActionHandler {
    private val pictureInPictureActionFilter = IntentFilter().apply {
        addAction(ACTION_PLAY_PAUSE)
        addAction(ACTION_SEEK_FORWARD)
        addAction(ACTION_SEEK_BACKWARD)
    }
    private val pictureInPictureActionReceiver: BroadcastReceiver = object : BroadcastReceiver() {
        override fun onReceive(context: Context?, intent: Intent?) {
            when (intent?.action) {
                ACTION_PLAY_PAUSE -> togglePlayback()
                ACTION_SEEK_FORWARD -> seekOrTimeshift(SEEK_INTERVAL_SECONDS)
                ACTION_SEEK_BACKWARD -> seekOrTimeshift(-SEEK_INTERVAL_SECONDS)
                else -> return
            }

            updatePictureInPictureParams()
        }
    }
    private var pictureInPictureActions: List<PictureInPictureAction> = emptyList()

    init {
        ActivityCompat.registerReceiver(
            activity,
            pictureInPictureActionReceiver,
            pictureInPictureActionFilter,
            ContextCompat.RECEIVER_NOT_EXPORTED,
        )
    }

    override fun updatePictureInPictureActions(actions: List<PictureInPictureAction>) {
        this.pictureInPictureActions = actions
        updatePictureInPictureParams()
    }

    override fun buildRemoteActions(): List<RemoteAction> {
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
            if (pictureInPictureActions.contains(PictureInPictureAction.Seek)) {
                add(seekBackwardAction)
            }
            if (pictureInPictureActions.contains(PictureInPictureAction.TogglePlayback)) {
                add(playPauseAction)
            }
            if (pictureInPictureActions.contains(PictureInPictureAction.Seek)) {
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

    private fun seekOrTimeshift(offset: Double) {
        if (player.isLive) {
            player.timeShift(player.timeShift + offset)
        } else {
            player.seek(player.currentTime + offset)
        }
    }

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

    override fun dispose() {
        activity.unregisterReceiver(pictureInPictureActionReceiver)
    }
}
