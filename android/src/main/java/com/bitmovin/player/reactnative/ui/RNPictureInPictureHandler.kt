package com.bitmovin.player.reactnative.ui

import android.app.PictureInPictureParams
import android.content.pm.PackageManager
import android.content.res.Configuration
import android.graphics.Rect
import android.os.Build
import android.util.Rational
import androidx.annotation.RequiresApi
import androidx.appcompat.app.AppCompatActivity
import com.bitmovin.player.api.ui.PictureInPictureHandler
import com.facebook.react.bridge.ReactApplicationContext

/**
 * Delegate object for `RNPictureInPictureHandler`. It delegates all view logic that needs
 * to be performed during each PiP state to this object.
 */
interface RNPictureInPictureDelegate {
    /**
     * Called whenever the handler's `isInPictureInPictureMode` changes to `true`.
     */
    fun onExitPictureInPicture()

    /**
     * Called whenever the handler's `isInPictureInPictureMode` changes to `false`.
     */
    fun onEnterPictureInPicture()

    /**
     * Called whenever the activity's PiP mode state changes with the new resources configuration.
     */
    fun onPictureInPictureModeChanged(isInPictureInPictureMode: Boolean, newConfig: Configuration?)

    /**
     * Called whenever the handler needs to compute a new `sourceRectHint` for PiP params.
     * The passed rect reference is expected to be fulfilled with the PlayerView's global visible
     * rect.
     */
    fun setSourceRectHint(sourceRectHint: Rect)
}

/**
 * Custom  PictureInPictureHandler` concrete implementation designed for React Native. It relies on
 * React Native's application context to manage the application's PiP state. Can be subclassed in
 * order to provide custom PiP capabilities.
 */
open class RNPictureInPictureHandler(val context: ReactApplicationContext) : PictureInPictureHandler {
    /**
     * PiP delegate object that contains the view logic to be performed on each PiP state change.
     */
    private var delegate: RNPictureInPictureDelegate? = null

    /**
     * Whether the user has enabled PiP support via `isPictureInPictureEnabled` playback configuration in JS.
     */
    var isPictureInPictureEnabled = false

    /**
     * Whether this view is currently in PiP mode.
     */
    var isInPictureInPictureMode = false

    /**
     * Whether the current Android version supports PiP mode.
     */
    private val isPictureInPictureSupported: Boolean
        get() = Build.VERSION.SDK_INT >= Build.VERSION_CODES.N &&
            context.packageManager.hasSystemFeature(PackageManager.FEATURE_PICTURE_IN_PICTURE)

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
     * Sets the new delegate object and update the activity's PiP parameters accordingly.
     */
    open fun setDelegate(delegate: RNPictureInPictureDelegate?) {
        this.delegate = delegate
        // Update the activity's PiP params once the delegate has been set.
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O && isPictureInPictureAvailable) {
            applyPictureInPictureParams()
        }
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
    open fun onConfigurationChanged(newConfig: Configuration?) {
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
            delegate?.onPictureInPictureModeChanged(it.isInPictureInPictureMode, newConfig)
            if (it.isInPictureInPictureMode) {
                delegate?.onEnterPictureInPicture()
            } else {
                delegate?.onExitPictureInPicture()
            }
            isInPictureInPictureMode = it.isInPictureInPictureMode
        }
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
        delegate?.setSourceRectHint(sourceRectHint)
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
     * Update source rect hint on activity's PiP params.
     */
    open fun updateSourceRectHint() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O || !isPictureInPictureAvailable) {
            return
        }
        currentActivity?.let {
            val sourceRectHint = Rect()
            delegate?.setSourceRectHint(sourceRectHint)
            it.setPictureInPictureParams(
                PictureInPictureParams.Builder()
                    .setSourceRectHint(sourceRectHint)
                    .build(),
            )
        }
    }
}
