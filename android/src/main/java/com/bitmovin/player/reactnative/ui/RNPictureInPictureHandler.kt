package com.bitmovin.player.reactnative.ui

import android.app.Activity
import android.app.Application
import android.app.PictureInPictureParams
import android.os.Build
import android.os.Bundle
import android.util.Log
import android.util.Rational
import androidx.annotation.RequiresApi
import com.bitmovin.player.api.Player
import com.bitmovin.player.api.event.PlayerEvent
import com.bitmovin.player.api.event.on
import com.bitmovin.player.reactnative.PictureInPictureAction
import com.bitmovin.player.reactnative.PictureInPictureConfig
import com.bitmovin.player.ui.DefaultPictureInPictureHandler

private const val TAG = "RNPiPHandler"

@RequiresApi(Build.VERSION_CODES.O)
class RNPictureInPictureHandler(
    private val activity: Activity,
    private val player: Player,
    private val pictureInPictureConfig: PictureInPictureConfig,
    private val onPictureInPictureExited: () -> Unit = {},
) : DefaultPictureInPictureHandler(activity, player) {
    private val pictureInPictureActionHandler = DefaultPictureInPictureActionHandler(
        activity,
        player,
        ::updatePictureInPictureParams,
    )

    // Current PiP implementation on the native side requires playerView.exitPictureInPicture() to be called
    // for `PictureInPictureExit` event to be emitted.
    // Additionally, the event is only emitted if `isPictureInPicture` is true. At the point in time we call
    // playerView.exitPictureInPicture() the activity will already have exited the PiP mode,
    // and thus the event won't be emitted. To work around this we keep track of the PiP state ourselves.
    private var _isPictureInPicture = false
    override val isPictureInPicture: Boolean
        get() = _isPictureInPicture

    var playerIsPlaying = false
        private set(value) {
            if (field == value) {
                return
            }
            field = value
            updatePictureInPictureParams()
        }

    private val setPlayerIsPlaying: (PlayerEvent) -> Unit = {
        playerIsPlaying = true
    }

    private val setPlayerIsNotPlaying: (PlayerEvent) -> Unit = {
        playerIsPlaying = false
    }

    private val onVideoPlaybackQualityChanged: (PlayerEvent.VideoPlaybackQualityChanged) -> Unit = {
        updatePictureInPictureParams()
    }

    private var pipTransactionEndedCallback: PipTransactionEndedActivityLifecycleCallback? = null

    init {
        playerIsPlaying = player.isPlaying
        subscribeToPlayerPlaybackEvents()
        updatePictureInPictureParams()
        player.on(onVideoPlaybackQualityChanged)
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

    private fun unsubscribeToPlayerPlaybackEvents() {
        player.off<PlayerEvent.Play>(setPlayerIsPlaying)
        player.off<PlayerEvent.Playing>(setPlayerIsPlaying)
        player.off<PlayerEvent.AdBreakStarted>(setPlayerIsPlaying)
        player.off<PlayerEvent.Paused>(setPlayerIsNotPlaying)
        player.off<PlayerEvent.PlaybackFinished>(setPlayerIsNotPlaying)
        player.off<PlayerEvent.Inactive>(setPlayerIsNotPlaying)
        player.off<PlayerEvent.Destroy>(setPlayerIsNotPlaying)
        player.off<PlayerEvent.Error>(setPlayerIsNotPlaying)
        player.off<PlayerEvent.AdBreakFinished>(setPlayerIsNotPlaying)
    }

    private fun getPiPAspectRatio() = player.playbackVideoData
        ?.let { Rational(it.width, it.height) }
        ?: Rational(16, 9)

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

        val callback = PipTransactionEndedActivityLifecycleCallback()
        activity.application.registerActivityLifecycleCallbacks(callback)
        pipTransactionEndedCallback = callback

        activity.enterPictureInPictureMode(buildPictureInPictureParams())
        _isPictureInPicture = true
    }

    override fun exitPictureInPicture() {
        super.exitPictureInPicture()
        _isPictureInPicture = false
    }

    @RequiresApi(Build.VERSION_CODES.O)
    private fun buildPictureInPictureParams(
        autoEnterEnabled: Boolean = pictureInPictureConfig.isAutoPipEnabled && playerIsPlaying,
    ) = PictureInPictureParams.Builder()
        .setAspectRatio(getPiPAspectRatio())
        .setActions(pictureInPictureActionHandler.buildRemoteActions())
        .apply {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                setAutoEnterEnabled(autoEnterEnabled)
            }
        }
        .build()

    private fun updatePictureInPictureParams() {
        activity.setPictureInPictureParams(buildPictureInPictureParams())
    }

    fun dispose() {
        pictureInPictureActionHandler.dispose()
        unsubscribeToPlayerPlaybackEvents()
        player.off(onVideoPlaybackQualityChanged)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            activity.setPictureInPictureParams(
                PictureInPictureParams.Builder()
                    .setAutoEnterEnabled(false)
                    .build(),
            )
        }
        pipTransactionEndedCallback?.let { callback ->
            activity.application.unregisterActivityLifecycleCallbacks(callback)
        }
        pipTransactionEndedCallback = null
    }

    private inner class PipTransactionEndedActivityLifecycleCallback : Application.ActivityLifecycleCallbacks {
        private var callbackReceived = false

        private fun unregisterCallback(activity:Activity) {
            activity.application.unregisterActivityLifecycleCallbacks(this)
            if (pipTransactionEndedCallback == this) {
                pipTransactionEndedCallback = null
            }
        }

        override fun onActivityCreated(activity: Activity, savedInstanceState: Bundle?) {
            // no-op
        }

        override fun onActivityDestroyed(activity: Activity) {
            // no-op
        }

        override fun onActivityPaused(activity: Activity) {
            // no-op
        }

        override fun onActivityResumed(activity: Activity) {
            // Called when the PiP mode is exited via restoring to the "normal" activity
            if (activity != this@RNPictureInPictureHandler.activity) {
                return
            }
            if (callbackReceived) {
                return
            }
            callbackReceived = true
            try {
                if (!isPictureInPicture) {
                    onPictureInPictureExited()
                }
            } finally {
                unregisterCallback(activity)
            }
        }

        override fun onActivitySaveInstanceState(activity: Activity, outState: Bundle) {
            // no-op
        }

        override fun onActivityStarted(activity: Activity) {
            // no-op
        }

        override fun onActivityStopped(activity: Activity) {
            // Called when the PiP mode is exited via closing the PiP window
            if (activity != this@RNPictureInPictureHandler.activity) {
                return
            }
            if (callbackReceived) {
                return
            }
            callbackReceived = true
            // No need to check the `isPictureInPicture` value, as `onActivityStopped` is called
            // when the activity gets destroyed from PiP mode
            try {
                onPictureInPictureExited()
            } finally {
                unregisterCallback(activity)
            }
        }
    }
}


private val PictureInPictureConfig.isAutoPipEnabled get() = isEnabled && shouldEnterOnBackground
