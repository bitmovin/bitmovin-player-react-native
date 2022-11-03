package com.bitmovin.player.reactnative

import android.annotation.SuppressLint
import android.app.PictureInPictureParams
import android.content.pm.PackageManager
import android.content.res.Configuration
import android.graphics.Rect
import android.os.Build
import android.util.Rational
import android.view.View
import android.widget.LinearLayout
import androidx.annotation.RequiresApi
import androidx.appcompat.app.AppCompatActivity
import com.bitmovin.player.PlayerView
import com.bitmovin.player.api.Player
import com.bitmovin.player.api.ui.PictureInPictureHandler
import com.facebook.react.bridge.LifecycleEventListener
import com.facebook.react.bridge.ReactApplicationContext

@SuppressLint("ViewConstructor")
open class RNBasePlayerView(val context: ReactApplicationContext): LinearLayout(context),
    LifecycleEventListener, PictureInPictureHandler, View.OnLayoutChangeListener {
    /**
     * Associated bitmovin's `PlayerView`.
     */
    var playerView: PlayerView? = null

    /**
     * Handy property accessor for `playerView`'s player instance.
     */
    var player: Player?
        get() = playerView?.player
        set(value) {
            playerView?.player = value
        }

    /**
     * Whether the user has enabled PiP support via `isPictureInPictureEnabled` playback configuration in JS.
     */
    var isPictureInPictureEnabled = false

    /**
     * Whether this view is currently in PiP mode.
     */
    var isInPictureInPictureMode = false

    /**
     * Whether this view should pause video playback when activity's onPause is called.
     * By default, `shouldPausePlayback` is set to false when entering PiP mode.
     */
    private var shouldPausePlayback: Boolean = true

    /**
     * Whether the current Android version supports PiP mode.
     */
    private val isPictureInPictureSupported: Boolean
        get() = Build.VERSION.SDK_INT >= Build.VERSION_CODES.N
            && context.packageManager.hasSystemFeature(PackageManager.FEATURE_PICTURE_IN_PICTURE)

    /**
     * Whether the picture in picture feature is available and enabled.
     */
    override val isPictureInPictureAvailable: Boolean
        get() = isPictureInPictureEnabled && isPictureInPictureSupported

    /**
     * Whether this view is currently in PiP mode. Required for PictureInPictureHandler interface.
     */
    override val isPictureInPicture: Boolean
        get() = isInPictureInPictureMode

    /**
     * Current React activity computed property.
     */
    private val currentActivity: AppCompatActivity?
        get() {
            if (context.hasCurrentActivity()) {
                return context.currentActivity as AppCompatActivity
            }
            return null
        }

    /**
     * Activity's onResume
     */
    override fun onHostResume() {
        playerView?.onResume()
    }

    /**
     * Activity's onPause
     */
    override fun onHostPause() {
        if (shouldPausePlayback) {
            playerView?.onPause()
        }
        shouldPausePlayback = true
    }

    /**
     * Activity's onDestroy
     */
    override fun onHostDestroy() {
        playerView?.onDestroy()
    }

    /**
     * Called whenever bitmovin's `PlayerView` needs to enter PiP mode.
     */
    override fun enterPictureInPicture() {
        if (isPictureInPictureAvailable) {
            currentActivity?.let {
                it.supportActionBar?.hide()
                it.enterPictureInPictureMode()
            }
        }
    }

    /**
     * Called whenever bitmovin's `PlayerView` needs to exit PiP mode.
     */
    override fun exitPictureInPicture() {
        if (isPictureInPictureAvailable) {
            currentActivity?.supportActionBar?.show()
        }
    }

    /**
     * Called whenever the activity content resources have changed.
     */
    override fun onConfigurationChanged(newConfig: Configuration?) {
        super.onConfigurationChanged(newConfig)
        // PiP mode is supported since Android 7.0
        if (isPictureInPictureAvailable) {
            handlePictureInPictureModeChanges(newConfig)
        }
    }

    /**
     * Checks whether the current activity `isInPictureInPictureMode` has changed since the last lifecycle
     * configuration change.
     */
    @RequiresApi(Build.VERSION_CODES.N)
    private fun handlePictureInPictureModeChanges(newConfig: Configuration?) = currentActivity?.let {
        if (isInPictureInPictureMode != it.isInPictureInPictureMode) {
            playerView?.onPictureInPictureModeChanged(it.isInPictureInPictureMode, newConfig)
            // update view PiP state
            if (it.isInPictureInPictureMode) {
                // if the player has just changed to PiP mode, then don't pause playback
                shouldPausePlayback = false
            } else {
                // manually call `exitPictureInPicture()` on player view otherwise `PictureInPictureExit`
                // event won't get dispatched.
                playerView?.exitPictureInPicture()
            }
            isInPictureInPictureMode = it.isInPictureInPictureMode
        }
    }

    /**
     * Some improvements in Android's PiP API have been added since version 8.0+ and this function
     * automatically applies them if available.
     *
     * You can read more about the recommended settings for PiP here:
     * - https://developer.android.com/develop/ui/views/picture-in-picture
     */
    fun enableSmoothTransitions() {
        // Android improvements for PiP transitions start from 8.0+ (Oreo)
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) {
            return
        }
        applyPictureInPictureParams()
        playerView?.addOnLayoutChangeListener(this)
    }

    /**
     * Applies Android recommended PiP params on the current activity for smoother transitions.
     *
     * You can read more about the recommended settings for PiP here:
     * - https://developer.android.com/develop/ui/views/picture-in-picture#smoother-transition
     * - https://developer.android.com/develop/ui/views/picture-in-picture#smoother-exit
     */
    @RequiresApi(Build.VERSION_CODES.O)
    private fun applyPictureInPictureParams() = currentActivity?.let {
        // See also: https://developer.android.com/develop/ui/views/picture-in-picture#smoother-transition
        val sourceRectHint = Rect()
        playerView?.getGlobalVisibleRect(sourceRectHint)
        val ratio = Rational(16, 9)
        val params = PictureInPictureParams.Builder()
            .setAspectRatio(ratio)
            .setSourceRectHint(sourceRectHint)
        when {
            // See also: https://developer.android.com/develop/ui/views/picture-in-picture#smoother-exit
            Build.VERSION.SDK_INT >= Build.VERSION_CODES.S ->
                params.setAutoEnterEnabled(true).setSeamlessResizeEnabled(true)
            Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU ->
                params.setExpandedAspectRatio(ratio)
        }
        it.setPictureInPictureParams(params.build())
    }

    /**
     * Called whenever player view's layout changes.
     */
    @RequiresApi(Build.VERSION_CODES.O)
    override fun onLayoutChange(
        view: View?,
        left: Int,
        top: Int,
        right: Int,
        bottom: Int,
        oldLeft: Int,
        oldTop: Int,
        oldRight: Int,
        oldBottom: Int,
    ) {
        if (left != oldLeft || right != oldRight || top != oldTop || bottom != oldBottom) {
            updateSourceRectHint()
        }
    }

    /**
     * Dispose player view layout listeners.
     */
    open fun dispose() {
        playerView?.removeOnLayoutChangeListener(this)
    }

    /**
     * Update source rect hint on activity's PiP params.
     */
    @RequiresApi(Build.VERSION_CODES.O)
    private fun updateSourceRectHint() = currentActivity?.let {
        val sourceRectHint = Rect()
        playerView?.getGlobalVisibleRect(sourceRectHint)
        it.setPictureInPictureParams(
            PictureInPictureParams.Builder()
                .setSourceRectHint(sourceRectHint)
                .build())
    }
}
