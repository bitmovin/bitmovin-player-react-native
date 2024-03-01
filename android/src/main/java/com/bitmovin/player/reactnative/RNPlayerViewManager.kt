package com.bitmovin.player.reactnative

import android.os.Handler
import android.os.Looper
import android.util.Log
import android.view.ViewGroup.LayoutParams
import com.bitmovin.player.PlayerView
import com.bitmovin.player.SubtitleView
import com.bitmovin.player.api.ui.PlayerViewConfig
import com.bitmovin.player.api.ui.ScalingMode
import com.bitmovin.player.api.ui.UiConfig
import com.bitmovin.player.reactnative.converter.toRNPlayerViewConfigWrapper
import com.bitmovin.player.reactnative.converter.toRNStyleConfigWrapperFromPlayerConfig
import com.bitmovin.player.reactnative.extensions.customMessageHandlerModule
import com.bitmovin.player.reactnative.extensions.getBooleanOrNull
import com.bitmovin.player.reactnative.extensions.getModule
import com.bitmovin.player.reactnative.extensions.playerModule
import com.bitmovin.player.reactnative.ui.FullscreenHandlerModule
import com.bitmovin.player.reactnative.ui.RNPictureInPictureHandler
import com.facebook.react.bridge.*
import com.facebook.react.module.annotations.ReactModule
import com.facebook.react.uimanager.SimpleViewManager
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.annotations.ReactProp
import java.security.InvalidParameterException

private const val MODULE_NAME = "NativePlayerView"

@ReactModule(name = MODULE_NAME)
class RNPlayerViewManager(private val context: ReactApplicationContext) : SimpleViewManager<RNPlayerView>() {
    /**
     * Native component functions.
     */
    enum class Commands(val command: String) {
        ATTACH_PLAYER("attachPlayer"),
        ATTACH_FULLSCREEN_BRIDGE("attachFullscreenBridge"),
        SET_CUSTOM_MESSAGE_HANDLER_BRIDGE_ID("setCustomMessageHandlerBridgeId"),
        SET_FULLSCREEN("setFullscreen"),
        SET_SCALING_MODE("setScalingMode"),
        SET_PICTURE_IN_PICTURE("setPictureInPicture"),
    }

    /**
     * Exported module name to JS.
     */
    override fun getName() = MODULE_NAME

    private var customMessageHandlerBridgeId: NativeId? = null
    private val handler = Handler(Looper.getMainLooper())

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
        "downloadFinished" to "onDownloadFinished",
        "videoDownloadQualityChanged" to "onVideoDownloadQualityChanged",
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
        "castStart" to "onCastStart",
        "castPlaybackFinished" to "onCastPlaybackFinished",
        "castPaused" to "onCastPaused",
        "castPlaying" to "onCastPlaying",
        "castStarted" to "onCastStarted",
        "castAvailable" to "onCastAvailable",
        "castStopped" to "onCastStopped",
        "castWaitingForDevice" to "onCastWaitingForDevice",
        "castTimeUpdated" to "onCastTimeUpdated",
        "cueEnter" to "onCueEnter",
        "cueExit" to "onCueExit",
    )

    /**
     * Component's event registry. Bubbling events are directly mapped to react props. No
     * need to use proxy functions or `NativeEventEmitter`.
     * @return map between event names (sent from native code) to js props.
     */
    override fun getExportedCustomBubblingEventTypeConstants(): MutableMap<String, Any> =
        bubblingEventsMapping.entries.associate {
            it.key to mapOf(
                "phasedRegistrationNames" to mapOf("bubbled" to it.value),
            )
        }.toMutableMap()

    /**
     * Component's command registry. They enable granular control over
     * instances of a certain native component from js and give the ability
     * to call 'functions' on them.
     * @return map between names (used in js) and command ids (used in native code).
     */
    override fun getCommandsMap(): Map<String, Int> = Commands.values().associate {
        it.command to it.ordinal
    }

    /**
     * Callback triggered in response to command dispatches from the js side.
     * @param view Root native view of the targeted component.
     * @param commandId Command number identifier. It's a number even though RN sends it as a string.
     * @param args Arguments list sent from the js side.
     */
    override fun receiveCommand(view: RNPlayerView, commandId: String?, args: ReadableArray?) {
        fun Int.toCommand(): Commands? = Commands.values().getOrNull(this)
        val command = commandId?.toInt()?.toCommand() ?: throw IllegalArgumentException(
            "The received command is not supported by the Bitmovin Player View",
        )
        fun <T> T?.require(): T = this ?: throw InvalidParameterException("Missing parameter")
        when (command) {
            Commands.ATTACH_PLAYER -> attachPlayer(view, args?.getString(1).require(), args?.getMap(2))
            Commands.ATTACH_FULLSCREEN_BRIDGE -> attachFullscreenBridge(view, args?.getString(1).require())
            Commands.SET_CUSTOM_MESSAGE_HANDLER_BRIDGE_ID -> setCustomMessageHandlerBridgeId(
                view,
                args?.getString(1).require(),
            )
            Commands.SET_FULLSCREEN -> setFullscreen(view, args?.getBoolean(1).require())
            Commands.SET_SCALING_MODE -> setScalingMode(view, args?.getString(1).require())
            Commands.SET_PICTURE_IN_PICTURE -> setPictureInPicture(view, args?.getBoolean(1).require())
        }
    }

    @ReactProp(name = "config")
    fun setConfig(view: RNPlayerView, config: ReadableMap?) {
        view.config = config?.toRNPlayerViewConfigWrapper()
    }

    private fun attachFullscreenBridge(view: RNPlayerView, fullscreenBridgeId: NativeId) {
        handler.postAndLogException {
            view.playerView?.setFullscreenHandler(
                context.getModule<FullscreenHandlerModule>()?.getInstance(fullscreenBridgeId),
            )
        }
    }

    private fun setFullscreen(view: RNPlayerView, isFullscreenRequested: Boolean) {
        handler.postAndLogException {
            val playerView = view.playerView ?: return@postAndLogException
            if (playerView.isFullscreen == isFullscreenRequested) return@postAndLogException
            if (isFullscreenRequested) {
                playerView.enterFullscreen()
            } else {
                playerView.exitFullscreen()
            }
        }
    }

    private fun setPictureInPicture(view: RNPlayerView, isPictureInPictureRequested: Boolean) {
        handler.postAndLogException {
            val playerView = view.playerView ?: throw IllegalStateException("The player view is not yet created")
            if (playerView.isPictureInPicture == isPictureInPictureRequested) return@postAndLogException
            if (isPictureInPictureRequested) {
                playerView.enterPictureInPicture()
            } else {
                playerView.exitPictureInPicture()
            }
        }
    }

    private fun setScalingMode(view: RNPlayerView, scalingMode: String) {
        handler.postAndLogException {
            view.playerView?.scalingMode = ScalingMode.valueOf(scalingMode)
        }
    }

    private fun setCustomMessageHandlerBridgeId(view: RNPlayerView, customMessageHandlerBridgeId: NativeId) {
        this.customMessageHandlerBridgeId = customMessageHandlerBridgeId
        attachCustomMessageHandlerBridge(view)
    }

    private fun attachCustomMessageHandlerBridge(view: RNPlayerView) {
        view.playerView?.setCustomMessageHandler(
            context.customMessageHandlerModule
                ?.getInstance(customMessageHandlerBridgeId)
                ?.customMessageHandler,
        )
    }

    /**
     * Set the `Player` instance for the target view using `playerId`.
     * @param view Target `RNPlayerView`.
     * @param playerId `Player` instance id inside `PlayerModule`'s registry.
     */
    private fun attachPlayer(view: RNPlayerView, playerId: NativeId, playerConfig: ReadableMap?) {
        handler.postAndLogException {
            val player = playerId.let { context.playerModule?.getPlayerOrNull(it) }
                ?: throw InvalidParameterException("Cannot create a PlayerView, invalid playerId was passed: $playerId")
            val playbackConfig = playerConfig?.getMap("playbackConfig")
            val isPictureInPictureEnabled = view.config?.pictureInPictureConfig?.isEnabled == true ||
                playbackConfig?.getBooleanOrNull("isPictureInPictureEnabled") == true
            val pictureInPictureHandler = view.pictureInPictureHandler ?: RNPictureInPictureHandler(context)
            view.pictureInPictureHandler = pictureInPictureHandler
            view.pictureInPictureHandler?.isPictureInPictureEnabled = isPictureInPictureEnabled

            val rnStyleConfigWrapper = playerConfig?.toRNStyleConfigWrapperFromPlayerConfig()
            val configuredPlayerViewConfig = view.config?.playerViewConfig ?: PlayerViewConfig()

            if (view.playerView != null) {
                view.player = player
            } else {
                // PlayerView has to be initialized with Activity context
                val currentActivity = context.currentActivity
                    ?: throw IllegalStateException("Cannot create a PlayerView, because no activity is attached.")
                val userInterfaceType = rnStyleConfigWrapper?.userInterfaceType ?: UserInterfaceType.Bitmovin
                val playerViewConfig: PlayerViewConfig = if (userInterfaceType != UserInterfaceType.Bitmovin) {
                    configuredPlayerViewConfig.copy(uiConfig = UiConfig.Disabled)
                } else {
                    configuredPlayerViewConfig
                }

                val playerView = PlayerView(currentActivity, player, playerViewConfig)

                playerView.layoutParams = LayoutParams(
                    LayoutParams.MATCH_PARENT,
                    LayoutParams.MATCH_PARENT,
                )
                view.setPlayerView(playerView)
                attachCustomMessageHandlerBridge(view)
            }

            if (rnStyleConfigWrapper?.styleConfig?.isUiEnabled != false &&
                rnStyleConfigWrapper?.userInterfaceType == UserInterfaceType.Subtitle
            ) {
                context.currentActivity?.let { activity ->
                    val subtitleView = SubtitleView(activity)
                    subtitleView.setPlayer(player)
                    view.setSubtitleView(subtitleView)
                }
            }
        }
    }

    /** Post and log any exceptions instead of crashing the app. */
    private inline fun Handler.postAndLogException(crossinline block: () -> Unit) = post {
        try {
            block()
        } catch (e: Exception) {
            Log.e(MODULE_NAME, "Error while executing command", e)
        }
    }
}
