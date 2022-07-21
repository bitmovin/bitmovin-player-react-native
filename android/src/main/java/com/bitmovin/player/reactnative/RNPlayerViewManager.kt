package com.bitmovin.player.reactnative

import android.os.Handler
import android.os.Looper
import android.view.ViewGroup.LayoutParams
import com.bitmovin.player.PlayerView
import com.facebook.react.bridge.*
import com.facebook.react.uimanager.SimpleViewManager
import com.facebook.react.uimanager.ThemedReactContext

class RNPlayerViewManager(private val context: ReactApplicationContext) : SimpleViewManager<RNPlayerView>() {
    /**
     * Native component functions.
     */
    enum class Commands {
        ATTACH_PLAYER,
    }

    /**
     * Exported module name to JS.
     */
    override fun getName() = "NativePlayerView"

    /**
     * The component's native view factory. RN calls this method multiple times
     * for each component instance.
     */
    override fun createViewInstance(reactContext: ThemedReactContext) = RNPlayerView(context)

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
        "timeChanged" to "onTimeChanged",
        "sourceLoad" to "onSourceLoad",
        "sourceLoaded" to "onSourceLoaded",
        "sourceUnloaded" to "onSourceUnloaded",
        "sourceError" to "onSourceError",
        "sourceWarning" to "onSourceWarning",
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
        "attachPlayer" to Commands.ATTACH_PLAYER.ordinal
    )

    /**
     * Callback triggered in response to command dispatches from the js side.
     * @param root Root native view of the targeted component.
     * @param commandId Command number identifier. It's a number even though RN sends it as a string.
     * @param args Arguments list sent from the js side.
     */
    override fun receiveCommand(view: RNPlayerView, commandId: String?, args: ReadableArray?) {
        super.receiveCommand(view, commandId, args)
        commandId?.toInt()?.let {
            when (it) {
                Commands.ATTACH_PLAYER.ordinal -> attachPlayer(view, args?.getString(1))
                else -> {}
            }
        }
    }

    /**
     * Set the `Player` instance for the target view using `playerId`.
     * @param view Target `RNPlayerView`.
     * @param playerId `Player` instance id inside `PlayerModule`'s registry.
     */
    private fun attachPlayer(view: RNPlayerView, playerId: String?) {
        Handler(Looper.getMainLooper()).post {
            val player = getPlayerModule()?.getPlayer(playerId)
            if (view.playerView != null) {
                view.player = player
            } else {
                val playerView = PlayerView(context, player)
                playerView.layoutParams = LayoutParams(
                    LayoutParams.MATCH_PARENT,
                    LayoutParams.MATCH_PARENT)
                view.addPlayerView(playerView)
            }
            view.startBubblingEvents()
        }
    }

    /**
     * Helper function that gets the instantiated `PlayerModule` from modules registry.
     */
    private fun getPlayerModule(): PlayerModule? =
        context.getNativeModule(PlayerModule::class.java)
}
