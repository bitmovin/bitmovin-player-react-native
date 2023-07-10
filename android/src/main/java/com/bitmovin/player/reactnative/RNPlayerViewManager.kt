package com.bitmovin.player.reactnative

import android.os.Handler
import android.os.Looper
import android.util.Log
import android.view.ViewGroup.LayoutParams
import com.bitmovin.player.PlayerView
import com.bitmovin.player.reactnative.extensions.getBooleanOrNull
import com.bitmovin.player.reactnative.extensions.getModule
import com.bitmovin.player.reactnative.ui.CustomMessageHandlerModule
import com.bitmovin.player.reactnative.ui.FullscreenHandlerModule
import com.bitmovin.player.reactnative.ui.RNPictureInPictureHandler
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReadableArray
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.module.annotations.ReactModule
import com.facebook.react.uimanager.SimpleViewManager
import com.facebook.react.uimanager.ThemedReactContext

private const val MODULE_NAME = "NativePlayerView"

@ReactModule(name = MODULE_NAME)
class RNPlayerViewManager(private val context: ReactApplicationContext) : SimpleViewManager<RNPlayerView>() {
    /**
     * Native component functions.
     */
    enum class Commands {
        ATTACH_PLAYER,
        ATTACH_FULLSCREEN_BRIDGE,
        SET_CUSTOM_MESSAGE_HANDLER_BRIDGE_ID,
    }

    /**
     * Exported module name to JS.
     */
    override fun getName() = MODULE_NAME

    private var customMessageHandlerBridgeId: NativeId? = null

    /**
     * React Native PiP handler instance. It can be subclassed, then set from other native
     * modules in case a full-custom implementation is needed. A default implementation is provided
     * out-of-the-box.
     */
    var pictureInPictureHandler = RNPictureInPictureHandler(context)

    /**
     * The component's native view factory. RN may call this method multiple times
     * for each component instance.
     */
    override fun createViewInstance(reactContext: ThemedReactContext) = RNPlayerView(context)

    /**
     * Called when the component's view gets detached from the view hierarchy. Useful to perform
     * cleanups.
     */
    override fun onDropViewInstance(view: RNPlayerView) {
        super.onDropViewInstance(view)
        view.dispose()
    }

    /**
     * A mapping between a event native identifier and its bubbled version that will
     * be accessed from React.
     */
    private val bubblingEventsMapping: Map<String, String> = mapOf(
        "event" to "onEvent",
        "playerError" to "onPlayerError",
        "playerWarning" to "onPlayerWarning",
        "destroy" to "onDestroy",
        "muted" to "onMuted",
        "unmuted" to "onUnmuted",
        "ready" to "onReady",
        "paused" to "onPaused",
        "play" to "onPlay",
        "playing" to "onPlaying",
        "playbackFinished" to "onPlaybackFinished",
        "seek" to "onSeek",
        "seeked" to "onSeeked",
        "timeShift" to "onTimeShift",
        "timeShifted" to "onTimeShifted",
        "stallStarted" to "onStallStarted",
        "stallEnded" to "onStallEnded",
        "timeChanged" to "onTimeChanged",
        "sourceLoad" to "onSourceLoad",
        "sourceLoaded" to "onSourceLoaded",
        "sourceUnloaded" to "onSourceUnloaded",
        "sourceError" to "onSourceError",
        "sourceWarning" to "onSourceWarning",
        "audioAdded" to "onAudioAdded",
        "audioChanged" to "onAudioChanged",
        "audioRemoved" to "onAudioRemoved",
        "subtitleAdded" to "onSubtitleAdded",
        "subtitleChanged" to "onSubtitleChanged",
        "subtitleRemoved" to "onSubtitleRemoved",
        "pictureInPictureAvailabilityChanged" to "onPictureInPictureAvailabilityChanged",
        "pictureInPictureEnter" to "onPictureInPictureEnter",
        "pictureInPictureExit" to "onPictureInPictureExit",
        "adBreakFinished" to "onAdBreakFinished",
        "adBreakStarted" to "onAdBreakStarted",
        "adClicked" to "onAdClicked",
        "adError" to "onAdError",
        "adFinished" to "onAdFinished",
        "adManifestLoad" to "onAdManifestLoad",
        "adManifestLoaded" to "onAdManifestLoaded",
        "adQuartile" to "onAdQuartile",
        "adScheduled" to "onAdScheduled",
        "adSkipped" to "onAdSkipped",
        "adStarted" to "onAdStarted",
        "videoPlaybackQualityChanged" to "onVideoPlaybackQualityChanged",
        "fullscreenEnabled" to "onFullscreenEnabled",
        "fullscreenDisabled" to "onFullscreenDisabled",
        "fullscreenEnter" to "onFullscreenEnter",
        "fullscreenExit" to "onFullscreenExit",
    )

    /**
     * Component's event registry. Bubbling events are directly mapped to react props. No
     * need to use proxy functions or `NativeEventEmitter`.
     * @return map between event names (sent from native code) to js props.
     */
    override fun getExportedCustomBubblingEventTypeConstants(): MutableMap<String, Any> =
        bubblingEventsMapping.entries.associate {
            it.key to mapOf(
                "phasedRegistrationNames" to mapOf("bubbled" to it.value)
            )
        }.toMutableMap()

    /**
     * Component's command registry. They enable granular control over
     * instances of a certain native component from js and give the ability
     * to call 'functions' on them.
     * @return map between names (used in js) and command ids (used in native code).
     */
    override fun getCommandsMap(): MutableMap<String, Int> = mutableMapOf(
        "attachPlayer" to Commands.ATTACH_PLAYER.ordinal,
        "attachFullscreenBridge" to Commands.ATTACH_FULLSCREEN_BRIDGE.ordinal,
        "setCustomMessageHandlerBridgeId" to Commands.SET_CUSTOM_MESSAGE_HANDLER_BRIDGE_ID.ordinal,
    )

    /**
     * Callback triggered in response to command dispatches from the js side.
     * @param view Root native view of the targeted component.
     * @param commandId Command number identifier. It's a number even though RN sends it as a string.
     * @param args Arguments list sent from the js side.
     */
    override fun receiveCommand(view: RNPlayerView, commandId: String?, args: ReadableArray?) {
        super.receiveCommand(view, commandId, args)
        commandId?.toInt()?.let {
            when (it) {
                Commands.ATTACH_PLAYER.ordinal -> attachPlayer(view, args?.getString(1), args?.getMap(2))
                Commands.ATTACH_FULLSCREEN_BRIDGE.ordinal -> args?.getString(1)?.let { fullscreenBridgeId ->
                    attachFullscreenBridge(view, fullscreenBridgeId)
                }
                Commands.SET_CUSTOM_MESSAGE_HANDLER_BRIDGE_ID.ordinal -> {
                    args?.getString(1)?.let { customMessageHandlerBridgeId ->
                        setCustomMessageHandlerBridgeId(view, customMessageHandlerBridgeId)
                    }
                }
                else -> {}
            }
        }
    }

    private fun attachFullscreenBridge(view: RNPlayerView, fullscreenBridgeId: NativeId) {
        Handler(Looper.getMainLooper()).post {
            view.playerView?.setFullscreenHandler(
                context.getModule<FullscreenHandlerModule>()?.getInstance(fullscreenBridgeId)
            )
        }
    }

    private fun setCustomMessageHandlerBridgeId(view: RNPlayerView, customMessageHandlerBridgeId: NativeId) {
        this.customMessageHandlerBridgeId = customMessageHandlerBridgeId
        attachCustomMessageHandlerBridge(view)
    }

    private fun attachCustomMessageHandlerBridge(view: RNPlayerView) {
        view.playerView?.setCustomMessageHandler(
            context.getModule<CustomMessageHandlerModule>()
                ?.getInstance(customMessageHandlerBridgeId)
                ?.customMessageHandler
        )
    }

    /**
     * Set the `Player` instance for the target view using `playerId`.
     * @param view Target `RNPlayerView`.
     * @param playerId `Player` instance id inside `PlayerModule`'s registry.
     */
    private fun attachPlayer(view: RNPlayerView, playerId: NativeId?, playerConfig: ReadableMap?) {
        Handler(Looper.getMainLooper()).post {
            val player = getPlayerModule()?.getPlayer(playerId)
            playerConfig
                ?.getMap("playbackConfig")
                ?.getBooleanOrNull("isPictureInPictureEnabled")
                ?.let {
                    pictureInPictureHandler.isPictureInPictureEnabled = it
                    view.pictureInPictureHandler = pictureInPictureHandler
                }
            if (view.playerView != null) {
                view.player = player
            } else {
                // PlayerView has to be initialized with Activity context
                val currentActivity = context.currentActivity
                if (currentActivity == null) {
                    Log.e(MODULE_NAME, "Cannot create a PlayerView, because no activity is attached.")
                    return@post
                }
                val playerView = PlayerView(currentActivity, player)
                playerView.layoutParams = LayoutParams(
                    LayoutParams.MATCH_PARENT,
                    LayoutParams.MATCH_PARENT
                )
                view.addPlayerView(playerView)
                attachCustomMessageHandlerBridge(view)
            }
        }
    }

    /**
     * Helper function that gets the instantiated `PlayerModule` from modules registry.
     */
    private fun getPlayerModule(): PlayerModule? = context.getModule()
}
