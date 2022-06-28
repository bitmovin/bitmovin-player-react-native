package com.bitmovin.player.reactnative

import android.annotation.SuppressLint
import android.view.ViewGroup
import android.widget.LinearLayout
import com.bitmovin.player.PlayerView
import com.bitmovin.player.api.Player
import com.bitmovin.player.api.event.Event
import com.bitmovin.player.api.event.PlayerEvent
import com.bitmovin.player.api.event.SourceEvent
import com.bitmovin.player.api.event.on
import com.bitmovin.player.reactnative.converter.JsonConverter
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContext
import com.facebook.react.uimanager.events.RCTEventEmitter

/**
 * Native view wrapper for component instances. It both serves as the main view
 * handled by RN (the actual player view is handled by the RNPlayerViewManager) and
 * exposes player events as bubbling events.
 */
@SuppressLint("ViewConstructor")
class RNPlayerView(context: ReactApplicationContext) : LinearLayout(context) {
    /**
     * Reference to the shared player view set as child.
     */
    private var playerView: PlayerView? = null

    /**
     * Handy property accessor for `playerView`'s player instance.
     */
    var player: Player?
        get() = playerView?.player
        set(value) {
            playerView?.player = value
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
        }
        startBubblingEvents()
    }

    /**
     * Remove `playerView` if it's child and stop bubbling events.
     */
    fun removePlayerView() {
        if (playerView != null) {
            stopBubblingEvents()
            playerView?.player = null
            removeView(playerView)
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
     * Start listening and emitting player events as bubbling events to the js side.
     */
    fun startBubblingEvents() {
        player?.on(onEvent)
        player?.on(onPlayerError)
        player?.on(onPlayerWarning)
        player?.on(onDestroy)
        player?.on(onMuted)
        player?.on(onUnmuted)
        player?.on(onReady)
        player?.on(onPaused)
        player?.on(onPlay)
        player?.on(onPlaying)
        player?.on(onPlaybackFinished)
        player?.on(onSeek)
        player?.on(onSeeked)
        player?.on(onTimeChanged)
        player?.on(onSourceLoad)
        player?.on(onSourceLoaded)
        player?.on(onSourceUnloaded)
        player?.on(onSourceError)
        player?.on(onSourceWarning)
    }

    /**
     * Stop listening for player events and cease to emit bubbling events.
     */
    fun stopBubblingEvents() {
        player?.off(onEvent)
        player?.off(onPlayerError)
        player?.off(onPlayerWarning)
        player?.off(onDestroy)
        player?.off(onMuted)
        player?.off(onUnmuted)
        player?.off(onReady)
        player?.off(onPaused)
        player?.off(onPlay)
        player?.off(onPlaying)
        player?.off(onPlaybackFinished)
        player?.off(onSeek)
        player?.off(onSeeked)
        player?.off(onTimeChanged)
        player?.off(onSourceLoad)
        player?.off(onSourceLoaded)
        player?.off(onSourceUnloaded)
        player?.off(onSourceError)
        player?.off(onSourceWarning)
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
