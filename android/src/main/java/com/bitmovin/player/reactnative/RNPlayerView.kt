package com.bitmovin.player.reactnative

import android.annotation.SuppressLint
import android.content.res.Configuration
import android.graphics.Rect
import android.view.View
import android.view.ViewGroup
import android.widget.LinearLayout
import com.bitmovin.player.PlayerView
import com.bitmovin.player.api.Player
import com.bitmovin.player.api.event.Event
import com.bitmovin.player.api.event.PlayerEvent
import com.bitmovin.player.api.event.SourceEvent
import com.bitmovin.player.api.event.on
import com.bitmovin.player.reactnative.converter.JsonConverter
import com.bitmovin.player.reactnative.ui.RNPictureInPictureDelegate
import com.bitmovin.player.reactnative.ui.RNPictureInPictureHandler
import com.facebook.react.bridge.LifecycleEventListener
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContext
import com.facebook.react.uimanager.events.RCTEventEmitter

/**
 * Native view wrapper for component instances. It both serves as the main view
 * handled by RN (the actual player view is handled by the RNPlayerViewManager) and
 * exposes player events as bubbling events.
 */
@SuppressLint("ViewConstructor")
class RNPlayerView(val context: ReactApplicationContext) : LinearLayout(context),
    LifecycleEventListener, View.OnLayoutChangeListener, RNPictureInPictureDelegate {
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
     * Object that handles PiP mode changes in React Native.
     */
    var pictureInPictureHandler: RNPictureInPictureHandler? = null

    /**
     * Whether this view should pause video playback when activity's onPause is called.
     * By default, `shouldPausePlaybackOnActivityPause` is set to false when entering PiP mode.
     */
    private var shouldPausePlaybackOnActivityPause = true

    /**
     * Register this view as an activity lifecycle listener on initialization.
     */
    init {
        context.addLifecycleEventListener(this)
    }

    /**
     * Cleans up the resources and listeners produced by this view.
     */
    fun dispose() {
        stopBubblingEvents()
        context.removeLifecycleEventListener(this)
        playerView?.removeOnLayoutChangeListener(this)
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
        if (shouldPausePlaybackOnActivityPause) {
            playerView?.onPause()
        }
        shouldPausePlaybackOnActivityPause = true
    }

    /**
     * Activity's onDestroy
     */
    override fun onHostDestroy() {
        playerView?.onDestroy()
    }

    /**
     * Set the given `playerView` as child and start bubbling events.
     * @param playerView Shared player view instance.
     */
    fun addPlayerView(playerView: PlayerView) {
        this.playerView = playerView
        if (playerView.parent != this) {
            (playerView.parent as ViewGroup?)?.removeView(playerView)
            addView(playerView)
            startBubblingEvents()
        }
        pictureInPictureHandler?.let {
            it.setDelegate(this)
            playerView.setPictureInPictureHandler(it)
            playerView.addOnLayoutChangeListener(this)
        }
    }

    /**
     * Called whenever this view's activity configuration changes.
     */
    override fun onConfigurationChanged(newConfig: Configuration?) {
        super.onConfigurationChanged(newConfig)
        pictureInPictureHandler?.onConfigurationChanged(newConfig)
    }

    /**
     * Called when the player has just entered PiP mode.
     */
    override fun onEnterPictureInPicture() {
        // Playback shouldn't be paused when entering PiP mode.
        shouldPausePlaybackOnActivityPause = false
    }

    /**
     * Called when the player has just exited PiP mode.
     */
    override fun onExitPictureInPicture() {
        // Explicitly call `exitPictureInPicture()` on PlayerView when exiting PiP state, otherwise
        // the `PictureInPictureExit` event won't get dispatched.
        playerView?.exitPictureInPicture()
    }

    /**
     * Called when the player's PiP mode changes with a new configuration object.
     */
    override fun onPictureInPictureModeChanged(isInPictureInPictureMode: Boolean, newConfig: Configuration?) {
        playerView?.onPictureInPictureModeChanged(isInPictureInPictureMode, newConfig)
    }

    /**
     * Called whenever the PiP handler needs to compute the PlayerView's global visible rect.
     */
    override fun setSourceRectHint(sourceRectHint: Rect) {
        playerView?.getGlobalVisibleRect(sourceRectHint)
    }

    /**
     * Called whenever PlayerView's layout changes.
     */
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
            // Update source rect hint whenever the player's layout change
            pictureInPictureHandler?.updateSourceRectHint()
        }
    }

    /**
     * Try to measure and update this view layout as much as possible to
     * avoid layout problems related to React or old layout values present
     * in `playerView` due to being previously attached to a different parent.
     */
    override fun requestLayout() {
        super.requestLayout()
        post {
            measure(
                MeasureSpec.makeMeasureSpec(width, MeasureSpec.EXACTLY),
                MeasureSpec.makeMeasureSpec(height, MeasureSpec.EXACTLY))
            layout(left, top, right, bottom)
        }
    }

    /**
     * `onEvent` event callback.
     */
    private val onEvent: (PlayerEvent) -> Unit = {
        emitEvent("event", it)
    }

    /**
     * `onPlayerError` event callback.
     */
    private val onPlayerError: (PlayerEvent.Error) -> Unit = {
        emitEvent("playerError", it)
    }

    /**
     * `onPlayerWarning` event callback.
     */
    private val onPlayerWarning: (PlayerEvent.Warning) -> Unit = {
        emitEvent("playerWarning", it)
    }

    /**
     * `onDestroy` event callback.
     */
    private val onDestroy: (PlayerEvent.Destroy) -> Unit = {
        emitEvent("destroy", it)
    }

    /**
     * `onMuted` event callback.
     */
    private val onMuted: (PlayerEvent.Muted) -> Unit = {
        emitEvent("muted", it)
    }

    /**
     * `onUnmuted` event callback.
     */
    private val onUnmuted: (PlayerEvent.Unmuted) -> Unit = {
        emitEvent("unmuted", it)
    }

    /**
     * `onReady` event callback.
     */
    private val onReady: (PlayerEvent.Ready) -> Unit = {
        emitEvent("ready", it)
    }

    /**
     * `onPaused` event callback.
     */
    private val onPaused: (PlayerEvent.Paused) -> Unit = {
        emitEvent("paused", it)
    }

    /**
     * `onPlay` event callback.
     */
    private val onPlay: (PlayerEvent.Play) -> Unit = {
        emitEvent("play", it)
    }

    /**
     * `onPlaying` event callback.
     */
    private val onPlaying: (PlayerEvent.Playing) -> Unit = {
        emitEvent("playing", it)
    }

    /**
     * `onPlaybackFinished` event callback.
     */
    private val onPlaybackFinished: (PlayerEvent.PlaybackFinished) -> Unit = {
        emitEvent("playbackFinished", it)
    }

    /**
     * `onSeek` event callback.
     */
    private val onSeek: (PlayerEvent.Seek) -> Unit = {
        emitEvent("seek", it)
    }

    /**
     * `onSeeked` event callback.
     */
    private val onSeeked: (PlayerEvent.Seeked) -> Unit = {
        emitEvent("seeked", it)
    }

    /**
     * `onStallStarted` event callback.
     */
    private val onStallStarted: (PlayerEvent.StallStarted) -> Unit = {
        emitEvent("stallStarted", it)
    }

    /**
     * `onStallEnded` event callback.
     */
    private val onStallEnded: (PlayerEvent.StallEnded) -> Unit = {
        emitEvent("stallEnded", it)
    }

    /**
     * `onTimeChanged` event callback.
     */
    private val onTimeChanged: (PlayerEvent.TimeChanged) -> Unit = {
        emitEvent("timeChanged", it)
    }

    /**
     * `onSourceLoad` event callback.
     */
    private val onSourceLoad: (SourceEvent.Load) -> Unit = {
        emitEvent("sourceLoad", it)
    }

    /**
     * `onSourceLoaded` event callback.
     */
    private val onSourceLoaded: (SourceEvent.Loaded) -> Unit = {
        emitEvent("sourceLoaded", it)
    }

    /**
     * `onSourceUnloaded` event callback.
     */
    private val onSourceUnloaded: (SourceEvent.Unloaded) -> Unit = {
        emitEvent("sourceUnloaded", it)
    }

    /**
     * `onSourceError` event callback.
     */
    private val onSourceError: (SourceEvent.Error) -> Unit = {
        emitEvent("sourceError", it)
    }

    /**
     * `onSourceWarning` event callback.
     */
    private val onSourceWarning: (SourceEvent.Warning) -> Unit = {
        emitEvent("sourceWarning", it)
    }

    /**
     * `onSubtitleAdded` event callback.
     */
    private val onSubtitleAdded: (SourceEvent.SubtitleTrackAdded) -> Unit = {
        emitEvent("subtitleAdded", it)
    }

    /**
     * `onSubtitleChanged` event callback.
     */
    private val onSubtitleChanged: (SourceEvent.SubtitleTrackChanged) -> Unit = {
        emitEvent("subtitleChanged", it)
    }

    /**
     * `onSubtitleRemoved` event callback.
     */
    private val onSubtitleRemoved: (SourceEvent.SubtitleTrackRemoved) -> Unit = {
        emitEvent("subtitleRemoved", it)
    }

    /**
     * `onPictureInPictureAvailabilityChanged` event callback.
     */
    private val onPictureInPictureAvailabilityChanged: (PlayerEvent.PictureInPictureAvailabilityChanged) -> Unit = {
        emitEvent("pictureInPictureAvailabilityChanged", it)
    }

    /**
     * `onPictureInPictureEnter` event callback.
     */
    private val onPictureInPictureEnter: (PlayerEvent.PictureInPictureEnter) -> Unit = {
        emitEvent("pictureInPictureEnter", it)
    }

    /**
     * `onPictureInPictureExit` event callback.
     */
    private val onPictureInPictureExit: (PlayerEvent.PictureInPictureExit) -> Unit = {
        emitEvent("pictureInPictureExit", it)
    }

    /**
     * `onAdBreakFinished` event callback.
     */
    private val onAdBreakFinished: (PlayerEvent.AdBreakFinished) -> Unit = {
        emitEvent("adBreakFinished", it)
    }

    /**
     * `onAdBreakStarted` event callback.
     */
    private val onAdBreakStarted: (PlayerEvent.AdBreakStarted) -> Unit = {
        emitEvent("adBreakStarted", it)
    }

    /**
     * `onAdClicked` event callback.
     */
    private val onAdClicked: (PlayerEvent.AdClicked) -> Unit = {
        emitEvent("adClicked", it)
    }

    /**
     * `onAdError` event callback.
     */
    private val onAdError: (PlayerEvent.AdError) -> Unit = {
        emitEvent("adError", it)
    }

    /**
     * `onAdFinished` event callback.
     */
    private val onAdFinished: (PlayerEvent.AdFinished) -> Unit = {
        emitEvent("adFinished", it)
    }

    /**
     * `onAdManifestLoad` event callback.
     */
    private val onAdManifestLoad: (PlayerEvent.AdManifestLoad) -> Unit = {
        emitEvent("adManifestLoad", it)
    }

    /**
     * `onAdManifestLoaded` event callback.
     */
    private val onAdManifestLoaded: (PlayerEvent.AdManifestLoaded) -> Unit = {
        emitEvent("adManifestLoaded", it)
    }

    /**
     * `onAdQuartile` event callback.
     */
    private val onAdQuartile: (PlayerEvent.AdQuartile) -> Unit = {
        emitEvent("adQuartile", it)
    }

    /**
     * `onAdScheduled` event callback.
     */
    private val onAdScheduled: (PlayerEvent.AdScheduled) -> Unit = {
        emitEvent("adScheduled", it)
    }

    /**
     * `onAdSkipped` event callback.
     */
    private val onAdSkipped: (PlayerEvent.AdSkipped) -> Unit = {
        emitEvent("adSkipped", it)
    }

    /**
     * `onAdStarted` event callback.
     */
    private val onAdStarted: (PlayerEvent.AdStarted) -> Unit = {
        emitEvent("adStarted", it)
    }


    /**
     * `onVideoPlaybackQualityChanged` event callback.
     */
    private val onVideoPlaybackQualityChanged: (PlayerEvent.VideoPlaybackQualityChanged) -> Unit = {
        emitEvent("videoPlaybackQualityChanged", it)
    }

    /**
     * Start listening and emitting player events as bubbling events to the js side.
     */
    fun startBubblingEvents() {
        player?.apply {
            on(onEvent)
            on(onPlayerError)
            on(onPlayerWarning)
            on(onDestroy)
            on(onMuted)
            on(onUnmuted)
            on(onReady)
            on(onPaused)
            on(onPlay)
            on(onPlaying)
            on(onPlaybackFinished)
            on(onSeek)
            on(onSeeked)
            on(onStallStarted)
            on(onStallEnded)
            on(onTimeChanged)
            on(onSourceLoad)
            on(onSourceLoaded)
            on(onSourceUnloaded)
            on(onSourceError)
            on(onSourceWarning)
            on(onSubtitleAdded)
            on(onSubtitleChanged)
            on(onSubtitleRemoved)
            on(onAdBreakFinished)
            on(onAdBreakStarted)
            on(onAdClicked)
            on(onAdError)
            on(onAdFinished)
            on(onAdManifestLoad)
            on(onAdManifestLoaded)
            on(onAdQuartile)
            on(onAdScheduled)
            on(onAdSkipped)
            on(onAdStarted)
            on(onVideoPlaybackQualityChanged)
        }
        playerView?.apply {
            on(onPictureInPictureAvailabilityChanged)
            on(onPictureInPictureEnter)
            on(onPictureInPictureExit)
        }
    }

    /**
     * Stop listening for player events and cease to emit bubbling events.
     */
    fun stopBubblingEvents() {
        player?.apply {
            off(onEvent)
            off(onPlayerError)
            off(onPlayerWarning)
            off(onDestroy)
            off(onMuted)
            off(onUnmuted)
            off(onReady)
            off(onPaused)
            off(onPlay)
            off(onPlaying)
            off(onPlaybackFinished)
            off(onSeek)
            off(onSeeked)
            off(onStallStarted)
            off(onStallEnded)
            off(onTimeChanged)
            off(onSourceLoad)
            off(onSourceLoaded)
            off(onSourceUnloaded)
            off(onSourceError)
            off(onSourceWarning)
            off(onSubtitleAdded)
            off(onSubtitleChanged)
            off(onSubtitleRemoved)
            off(onAdBreakFinished)
            off(onAdBreakStarted)
            off(onAdClicked)
            off(onAdError)
            off(onAdFinished)
            off(onAdManifestLoad)
            off(onAdManifestLoaded)
            off(onAdQuartile)
            off(onAdScheduled)
            off(onAdSkipped)
            off(onAdStarted)
            off(onVideoPlaybackQualityChanged)
        }
        playerView?.apply {
            off(onPictureInPictureAvailabilityChanged)
            off(onPictureInPictureEnter)
            off(onPictureInPictureExit)
        }
    }

    /**
     * Emits a bubbling event with payload to js.
     * @param event Native event name.
     * @param json Optional js object to be sent as payload.
     */
    private inline fun <reified E : Event> emitEvent(name: String, event: E) {
        val payload = if (event is PlayerEvent) {
            JsonConverter.fromPlayerEvent(event)
        } else {
            JsonConverter.fromSourceEvent(event as SourceEvent)
        }
        val reactContext = context as ReactContext
        reactContext
            .getJSModule(RCTEventEmitter::class.java)
            .receiveEvent(id, name, payload)
    }
}
