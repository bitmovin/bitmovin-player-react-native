package com.bitmovin.player.reactnative

import android.annotation.SuppressLint
import android.view.ViewGroup
import android.widget.LinearLayout
import com.bitmovin.player.PlayerView
import com.bitmovin.player.api.Player
import com.bitmovin.player.api.event.Event
import com.bitmovin.player.api.event.PlayerEvent
import com.bitmovin.player.api.event.SourceEvent
import com.bitmovin.player.reactnative.converter.JsonConverter
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContext
import com.facebook.react.uimanager.events.RCTEventEmitter

private val EVENT_CLASS_TO_REACT_NATIVE_NAME_MAPPING = mapOf(
    PlayerEvent::class to "event",
    PlayerEvent.Error::class to "playerError",
    PlayerEvent.Warning::class to "playerWarning",
    PlayerEvent.Destroy::class to "destroy",
    PlayerEvent.Muted::class to "muted",
    PlayerEvent.Unmuted::class to "unmuted",
    PlayerEvent.Ready::class to "ready",
    PlayerEvent.Paused::class to "paused",
    PlayerEvent.Play::class to "play",
    PlayerEvent.Playing::class to "playing",
    PlayerEvent.PlaybackFinished::class to "playbackFinished",
    PlayerEvent.Seek::class to "seek",
    PlayerEvent.Seeked::class to "seeked",
    PlayerEvent.TimeChanged::class to "timeChanged",
    SourceEvent.Load::class to "sourceLoad",
    SourceEvent.Loaded::class to "sourceLoaded",
    SourceEvent.Unloaded::class to "sourceUnloaded",
    SourceEvent.Error::class to "sourceError",
    SourceEvent.Warning::class to "sourceWarning",
    SourceEvent.SubtitleTrackAdded::class to "subtitleAdded",
    SourceEvent.SubtitleTrackChanged::class to "subtitleChanged",
    SourceEvent.SubtitleTrackRemoved::class to "subtitleRemoved",
)

/**
 * Native view wrapper for component instances. It both serves as the main view
 * handled by RN (the actual player view is handled by the RNPlayerViewManager) and
 * exposes player events as bubbling events.
 */
@SuppressLint("ViewConstructor")
class RNPlayerView(context: ReactApplicationContext) : LinearLayout(context) {
    /**
     * Relays the provided set of events, emitted by the player, together with the associated name
     * to the `eventOutput` callback.
     */
    private val eventRelay = PlayerEventRelay(EVENT_CLASS_TO_REACT_NATIVE_NAME_MAPPING, this::emitEvent)

    /**
     * Reference to the shared player view set as child.
     */
    var playerView: PlayerView? = null
        set(value) {
            field = value
            eventRelay.player = field?.player
        }

    /**
     * Handy property accessor for `playerView`'s player instance.
     */
    var player: Player?
        get() = playerView?.player
        set(value) {
            playerView?.player = value
            eventRelay.player = value
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
                MeasureSpec.makeMeasureSpec(height, MeasureSpec.EXACTLY)
            )
            layout(left, top, right, bottom)
        }
    }

    /**
     * Emits a bubbling event with payload to js.
     * @param event Native event name.
     * @param json Optional js object to be sent as payload.
     */
    private fun <E : Event> emitEvent(name: String, event: E) {
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
