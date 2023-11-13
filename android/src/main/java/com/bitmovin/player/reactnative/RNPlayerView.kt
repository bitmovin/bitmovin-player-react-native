package com.bitmovin.player.reactnative

import android.annotation.SuppressLint
import android.content.res.Configuration
import android.graphics.Rect
import android.view.View
import android.view.ViewGroup
import android.widget.FrameLayout
import androidx.lifecycle.DefaultLifecycleObserver
import androidx.lifecycle.LifecycleOwner
import com.bitmovin.player.PlayerView
import com.bitmovin.player.SubtitleView
import com.bitmovin.player.api.Player
import com.bitmovin.player.api.event.Event
import com.bitmovin.player.api.event.PlayerEvent
import com.bitmovin.player.api.event.SourceEvent
import com.bitmovin.player.api.ui.PlayerViewConfig
import com.bitmovin.player.api.ui.StyleConfig
import com.bitmovin.player.reactnative.converter.JsonConverter
import com.bitmovin.player.reactnative.ui.RNPictureInPictureDelegate
import com.bitmovin.player.reactnative.ui.RNPictureInPictureHandler
import com.facebook.react.ReactActivity
import com.facebook.react.bridge.*
import com.facebook.react.uimanager.events.RCTEventEmitter
import kotlin.reflect.KClass

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
    PlayerEvent.TimeShift::class to "timeShift",
    PlayerEvent.TimeShifted::class to "timeShifted",
    PlayerEvent.StallStarted::class to "stallStarted",
    PlayerEvent.StallEnded::class to "stallEnded",
    PlayerEvent.TimeChanged::class to "timeChanged",
    SourceEvent.Load::class to "sourceLoad",
    SourceEvent.Loaded::class to "sourceLoaded",
    SourceEvent.Unloaded::class to "sourceUnloaded",
    SourceEvent.Error::class to "sourceError",
    SourceEvent.Warning::class to "sourceWarning",
    SourceEvent.SubtitleTrackAdded::class to "subtitleAdded",
    SourceEvent.SubtitleTrackChanged::class to "subtitleChanged",
    SourceEvent.SubtitleTrackRemoved::class to "subtitleRemoved",
    SourceEvent.AudioTrackAdded::class to "audioAdded",
    SourceEvent.AudioTrackChanged::class to "audioChanged",
    SourceEvent.AudioTrackRemoved::class to "audioRemoved",
    SourceEvent.DownloadFinished::class to "downloadFinished",
    SourceEvent.VideoDownloadQualityChanged::class to "videoDownloadQualityChanged",
    PlayerEvent.AdBreakFinished::class to "adBreakFinished",
    PlayerEvent.AdBreakStarted::class to "adBreakStarted",
    PlayerEvent.AdClicked::class to "adClicked",
    PlayerEvent.AdError::class to "adError",
    PlayerEvent.AdFinished::class to "adFinished",
    PlayerEvent.AdManifestLoad::class to "adManifestLoad",
    PlayerEvent.AdManifestLoaded::class to "adManifestLoaded",
    PlayerEvent.AdQuartile::class to "adQuartile",
    PlayerEvent.AdScheduled::class to "adScheduled",
    PlayerEvent.AdSkipped::class to "adSkipped",
    PlayerEvent.AdStarted::class to "adStarted",
    PlayerEvent.VideoPlaybackQualityChanged::class to "videoPlaybackQualityChanged",
    PlayerEvent.CastStart::class to "castStart",
    @Suppress("DEPRECATION")
    PlayerEvent.CastPlaybackFinished::class to "castPlaybackFinished",
    @Suppress("DEPRECATION")
    PlayerEvent.CastPaused::class to "castPaused",
    @Suppress("DEPRECATION")
    PlayerEvent.CastPlaying::class to "castPlaying",
    PlayerEvent.CastStarted::class to "castStarted",
    PlayerEvent.CastAvailable::class to "castAvailable",
    PlayerEvent.CastStopped::class to "castStopped",
    PlayerEvent.CastWaitingForDevice::class to "castWaitingForDevice",
    PlayerEvent.CastTimeUpdated::class to "castTimeUpdated",
)

private val EVENT_CLASS_TO_REACT_NATIVE_NAME_MAPPING_UI = mapOf<KClass<out Event>, String>(
    PlayerEvent.PictureInPictureAvailabilityChanged::class to "pictureInPictureAvailabilityChanged",
    PlayerEvent.PictureInPictureEnter::class to "pictureInPictureEnter",
    PlayerEvent.PictureInPictureExit::class to "pictureInPictureExit",
    PlayerEvent.FullscreenEnabled::class to "fullscreenEnabled",
    PlayerEvent.FullscreenDisabled::class to "fullscreenDisabled",
    PlayerEvent.FullscreenEnter::class to "fullscreenEnter",
    PlayerEvent.FullscreenExit::class to "fullscreenExit",
)

/**
 * Native view wrapper for component instances. It both serves as the main view
 * handled by RN (the actual player view is handled by the RNPlayerViewManager) and
 * exposes player events as bubbling events.
 */
@SuppressLint("ViewConstructor")
class RNPlayerView(
    private val context: ReactApplicationContext,
) : FrameLayout(context), View.OnLayoutChangeListener, RNPictureInPictureDelegate {
    private val activityLifecycle = (context.currentActivity as? ReactActivity)?.lifecycle
        ?: error("Trying to create an instance of ${this::class.simpleName} while not attached to a ReactActivity")

    private val activityLifecycleObserver = object : DefaultLifecycleObserver {
        override fun onStart(owner: LifecycleOwner) {
            playerView?.onStart()
        }

        override fun onResume(owner: LifecycleOwner) {
            playerView?.onResume()
        }

        override fun onPause(owner: LifecycleOwner) {
            playerView?.onPause()
        }

        override fun onStop(owner: LifecycleOwner) {
            playerView?.onStop()
        }

        override fun onDestroy(owner: LifecycleOwner) = dispose()
    }

    init {
        // React Native has a bug that dynamically added views sometimes aren't laid out again properly.
        // Since we dynamically add and remove SurfaceView under the hood this caused the player
        // to suddenly not show the video anymore because SurfaceView was not laid out properly.
        // Bitmovin player issue: https://github.com/bitmovin/bitmovin-player-react-native/issues/180
        // React Native layout issue: https://github.com/facebook/react-native/issues/17968
        getViewTreeObserver().addOnGlobalLayoutListener { requestLayout() }

        activityLifecycle.addObserver(activityLifecycleObserver)
    }

    /**
     * Relays the provided set of events, emitted by the player, together with the associated name
     * to the `eventOutput` callback.
     */
    private val playerEventRelay = EventRelay<Player, Event>(EVENT_CLASS_TO_REACT_NATIVE_NAME_MAPPING, ::emitEvent)

    /**
     * Relays the provided set of events, emitted by the player view, together with the associated name
     * to the `eventOutput` callback.
     */
    private val viewEventRelay = EventRelay<PlayerView, Event>(EVENT_CLASS_TO_REACT_NATIVE_NAME_MAPPING_UI, ::emitEvent)

    private var _playerView: PlayerView? = null
        set(value) {
            field = value
            viewEventRelay.eventEmitter = field
            playerEventRelay.eventEmitter = field?.player
        }

    /**
     * Associated Bitmovin's `PlayerView`.
     */
    val playerView: PlayerView?
        get() = _playerView

    private var subtitleView: SubtitleView? = null

    /**
     * Handy property accessor for `playerView`'s player instance.
     */
    var player: Player?
        get() = playerView?.player
        set(value) {
            playerView?.player = value
            playerEventRelay.eventEmitter = value
        }

    /**
     * Object that handles PiP mode changes in React Native.
     */
    var pictureInPictureHandler: RNPictureInPictureHandler? = null

    /**
     * Configures the visual presentation and behaviour of the [playerView].
     */
    var config: RNPlayerViewConfigWrapper? = null

    /**
     * Cleans up the resources and listeners produced by this view.
     */
    fun dispose() {
        viewEventRelay.eventEmitter = null
        playerEventRelay.eventEmitter = null
        playerView?.removeOnLayoutChangeListener(this)
        playerView?.onDestroy()
        activityLifecycle.removeObserver(activityLifecycleObserver)
    }

    /**
     * Set the given `playerView` as child and start bubbling events.
     * @param playerView Shared player view instance.
     */
    fun setPlayerView(playerView: PlayerView) {
        this.playerView?.let { currentPlayerView ->
            (currentPlayerView.parent as? ViewGroup)?.removeView(currentPlayerView)
        }
        this._playerView = playerView
        if (playerView.parent != this) {
            (playerView.parent as ViewGroup?)?.removeView(playerView)
            addView(playerView, 0)
        }
        pictureInPictureHandler?.let {
            it.setDelegate(this)
            playerView.setPictureInPictureHandler(it)
            playerView.addOnLayoutChangeListener(this)
        }
    }

    /**
     * Set the given `subtitleView` as a child
     */
    fun setSubtitleView(subtitleView: SubtitleView) {
        this.subtitleView?.let { currentSubtitleView ->
            (currentSubtitleView.parent as? ViewGroup)?.removeView(currentSubtitleView)
        }
        this.subtitleView = subtitleView
        addView(subtitleView)
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
        // Nothing to do
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
                MeasureSpec.makeMeasureSpec(height, MeasureSpec.EXACTLY),
            )
            layout(left, top, right, bottom)
        }
    }

    /**
     * Emits a bubbling event with payload to js.
     * @param name Native event name.
     * @param event Optional js object to be sent as payload.
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

/**
 * Representation of the React Native API `PlayerViewConfig` object.
 * This is necessary as not all of its values can be directly mapped to the native `PlayerViewConfig`.
 */
data class RNPlayerViewConfigWrapper(
    val playerViewConfig: PlayerViewConfig?,
    val pictureInPictureConfig: RNPictureInPictureHandler.PictureInPictureConfig?,
)

data class RNStyleConfigWrapper(
    val styleConfig: StyleConfig?,
    val userInterfaceType: UserInterfaceType,
)

enum class UserInterfaceType {
    Bitmovin, Subtitle
}
