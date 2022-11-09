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
     * Set the given `playerView` as child and start bubbling events.
     * @param playerView Shared player view instance.
     */
    fun addPlayerView(playerView: PlayerView) {
        this.playerView = playerView
        if (playerView.parent != this) {
            (playerView.parent as ViewGroup?)?.removeView(playerView)
            addView(playerView)
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

    private val onVideoPlaybackQualityChanged: (PlayerEvent.VideoPlaybackQualityChanged) -> Unit = {
        emitEvent("videoPlaybackQualityChanged", it)
    }

    private val onVideoSizeChanged: (PlayerEvent.VideoSizeChanged) -> Unit = {
        emitEvent("videoSizeChanged", it)
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
            on(onTimeChanged)
            on(onSourceLoad)
            on(onSourceLoaded)
            on(onSourceUnloaded)
            on(onSourceError)
            on(onSourceWarning)
            on(onSubtitleAdded)
            on(onSubtitleChanged)
            on(onSubtitleRemoved)
            on(onVideoPlaybackQualityChanged)
            on(onVideoSizeChanged)
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
            off(onTimeChanged)
            off(onSourceLoad)
            off(onSourceLoaded)
            off(onSourceUnloaded)
            off(onSourceError)
            off(onSourceWarning)
            off(onSubtitleAdded)
            off(onSubtitleChanged)
            off(onSubtitleRemoved)
            off(onVideoPlaybackQualityChanged)
            off(onVideoSizeChanged)
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
