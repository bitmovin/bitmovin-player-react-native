package com.bitmovin.player.reactnative

import android.annotation.SuppressLint
import android.app.PictureInPictureParams
import android.content.pm.PackageManager
import android.graphics.Rect
import android.os.Build
import android.util.Log
import android.util.Rational
import android.view.View
import android.view.ViewGroup
import android.widget.LinearLayout
import androidx.annotation.RequiresApi
import androidx.appcompat.app.AppCompatActivity
import androidx.core.app.PictureInPictureModeChangedInfo
import androidx.core.util.Consumer
import androidx.lifecycle.DefaultLifecycleObserver
import androidx.lifecycle.LifecycleOwner
import com.bitmovin.player.PlayerView
import com.bitmovin.player.api.Player
import com.bitmovin.player.api.event.Event
import com.bitmovin.player.api.event.PlayerEvent
import com.bitmovin.player.api.event.SourceEvent
import com.bitmovin.player.reactnative.converter.JsonConverter
import com.bitmovin.player.ui.DefaultPictureInPictureHandler
import com.facebook.react.bridge.ReactContext
import com.facebook.react.uimanager.ThemedReactContext
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
    SourceEvent.DurationChanged::class to "durationChanged",
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
    PlayerEvent.VideoSizeChanged::class to "videoSizeChanged",
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
class RNPlayerView(val context: ThemedReactContext) : LinearLayout(context),
    DefaultLifecycleObserver {

    init {
        // React Native has a bug that dynamically added views sometimes aren't laid out again properly.
        // Since we dynamically add and remove SurfaceView under the hood this caused the player
        // to suddenly not show the video anymore because SurfaceView was not laid out properly.
        // Bitmovin player issue: https://github.com/bitmovin/bitmovin-player-react-native/issues/180
        // React Native layout issue: https://github.com/facebook/react-native/issues/17968
        getViewTreeObserver().addOnGlobalLayoutListener { requestLayout() }
    }

    /**
     * Relays the provided set of events, emitted by the player, together with the associated name
     * to the `eventOutput` callback.
     */
    private val playerEventRelay =
        EventRelay<Player, Event>(EVENT_CLASS_TO_REACT_NATIVE_NAME_MAPPING, ::emitEvent)

    /**
     * Relays the provided set of events, emitted by the player view, together with the associated name
     * to the `eventOutput` callback.
     */
    private val viewEventRelay =
        EventRelay<PlayerView, Event>(EVENT_CLASS_TO_REACT_NATIVE_NAME_MAPPING_UI, ::emitEvent)

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
     * Associated bitmovin's `PlayerView`.
     */
    var playerView: PlayerView? = null
        set(value) {
            field = value
            viewEventRelay.eventEmitter = field
            playerEventRelay.eventEmitter = field?.player
        }

    /**
     * Handy property accessor for `playerView`'s player instance.
     */
    var player: Player?
        get() = playerView?.player
        set(value) {
            playerView?.player = value
            playerEventRelay.eventEmitter = value

            if (shouldDoPictureInPicture) {
                playerView?.setPictureInPictureHandler(
                    DefaultPictureInPictureHandler(currentActivity, value)
                )
            }
        }

    /**
     * Whether the view should enable picture in picture.
     */
    var isPictureInPictureEnabled = false

    /**
     * Whether the current Android version supports PiP mode.
     */
    private val isPictureInPictureAvailable: Boolean
        get() = Build.VERSION.SDK_INT >= Build.VERSION_CODES.O
                && context.packageManager.hasSystemFeature(PackageManager.FEATURE_PICTURE_IN_PICTURE)

    /**
     * Handy property accessor for if PiP is available and enabled
     */
    private val shouldDoPictureInPicture: Boolean
        get() = isPictureInPictureAvailable && isPictureInPictureEnabled

    @RequiresApi(Build.VERSION_CODES.O)
    private var pipChangedListener: Consumer<PictureInPictureModeChangedInfo> =
        Consumer<PictureInPictureModeChangedInfo> {
            playerView?.onPictureInPictureModeChanged(
                it.isInPictureInPictureMode,
                it.newConfig
            )
        }

    /**
     * Handy property accessor for disabling the ad ui
     */
    var disableAdUi: Boolean? = false

    /**
     * Whether the view should enable background playback.
     */
    var isBackgroundPlaybackEnabled = false

    /**
     * Register this view as an activity lifecycle listener on initialization.
     */
    init {
        currentActivity?.lifecycle?.addObserver(this)
        if (shouldDoPictureInPicture) {
            currentActivity?.addOnPictureInPictureModeChangedListener(pipChangedListener)
        }
    }

    /**
     * Cleans up the resources and listeners produced by this view.
     */
    fun dispose() {
        viewEventRelay.eventEmitter = null
        playerEventRelay.eventEmitter = null
        currentActivity?.lifecycle?.removeObserver(this)
        if (isPictureInPictureAvailable) {
            currentActivity?.removeOnPictureInPictureModeChangedListener(pipChangedListener)

            val params = PictureInPictureParams.Builder()
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                params.setAutoEnterEnabled(false)
            }
            currentActivity?.setPictureInPictureParams(params.build())
        }
    }

    override fun onStart(owner: LifecycleOwner) {
        playerView?.onStart()
        super.onStart(owner)
    }

    override fun onResume(owner: LifecycleOwner) {
        playerView?.onResume()
        super.onResume(owner)
    }

    override fun onPause(owner: LifecycleOwner) {
        playerView?.onPause()
        super.onPause(owner)
    }

    override fun onStop(owner: LifecycleOwner) {
        if (!isBackgroundPlaybackEnabled) {
            playerView?.onStop()
        }
        super.onStop(owner)
    }

    override fun onDestroy(owner: LifecycleOwner) {
        playerView?.onDestroy()
        super.onDestroy(owner)
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

        if (shouldDoPictureInPicture) {
            playerView.setPictureInPictureHandler(
                DefaultPictureInPictureHandler(currentActivity, playerView.player)
            )

            currentActivity?.let {
                val sourceRectHint = Rect()
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
    private inline fun <reified E : Event> emitEvent(name: String, event: E) {
        if (disableAdUi == true && event is PlayerEvent.AdStarted) {
            try {
                // HACK, IMA does not provide any public API for removing their Ad controls interface, this hunts down the controls and removes them
                // this should continue to work as long as IMA wraps their controls in a WebView
                LayoutTraverser.build(object : LayoutTraverser.Processor {
                    override fun process(view: View?) {
                        try {
                            if (view.toString().contains("android.webkit.WebView")) {
                                view?.visibility = View.GONE
                            }
                        } catch (e: Exception) {
                            Log.e(
                                "AngelMobile",
                                "class=RNPlayerView action=ErrorHidingAdsWebView",
                                e
                            )
                        }
                    }
                }).traverse(this)
            } catch (e: Exception) {
                Log.e("AngelMobile", "class=RNPlayerView action=ErrorTraversingForAdViews", e)
            }
        }

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

class LayoutTraverser private constructor(private val processor: Processor) {
    interface Processor {
        fun process(view: View?)
    }

    fun traverse(root: ViewGroup) {
        val childCount = root.childCount
        for (i in 0 until childCount) {
            val child = root.getChildAt(i)
            if (child !== null) {
                processor.process(child)
                if (child is ViewGroup) {
                    traverse(child)
                }
            }
        }
    }

    companion object {
        fun build(processor: Processor): LayoutTraverser {
            return LayoutTraverser(processor)
        }
    }
}
