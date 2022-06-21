package com.bitmovin.reactnative

import android.util.Log
import android.widget.LinearLayout
import com.bitmovin.player.PlayerView
import com.bitmovin.player.api.Player
import com.bitmovin.player.api.PlayerConfig
import com.bitmovin.reactnative.converter.JsonConverter
import com.facebook.react.bridge.*
import com.facebook.react.uimanager.SimpleViewManager
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.UIManagerModule

class RNPlayerViewManager(
  private val context: ReactApplicationContext
) : SimpleViewManager<RNPlayerView>(), LifecycleEventListener {
  /**
   * Native component functions.
   */
  enum class Commands {
    CREATE,
    LOAD_SOURCE,
    UNLOAD,
    PLAY,
    PAUSE,
    SEEK,
    MUTE,
    UNMUTE,
    DESTROY,
    SET_VOLUME,
  }

  /**
   * Exported js module name.
   */
  override fun getName() = "NativePlayerView"

  /**
   * Module's initialization hook.
   */
  override fun initialize() {
    super.initialize()
    context.addLifecycleEventListener(this)
  }

  /**
   * Module's invalidation hook.
   */
  override fun invalidate() {
    context.removeLifecycleEventListener(this)
    super.invalidate()
  }

  /**
   * The component's native view factory. RN calls this method multiple times
   * for each component instance.
   */
  override fun createViewInstance(reactContext: ThemedReactContext) = RNPlayerView(context)

  /**
   * Component's event registry. Bubbling events are directly mapped to react props. No
   * need to use proxy functions or `NativeEventEmitter`.
   * @return map between event names (sent from native code) to js props.
   */
  override fun getExportedCustomBubblingEventTypeConstants(): MutableMap<String, Any> =
    mutableMapOf(
      // e.g. this event can be accessed as `<NativePlayerView onReady={...} />` from js.
      "ready" to mapOf("phasedRegistrationNames" to mapOf("bubbled" to "onReady"))
    )

  /**
   * Component's command registry. They enable granular control over
   * instances of a certain native component from js and give the ability
   * to call 'functions' on them.
   * @return map between names (used in js) and command ids (used in native code).
   */
  override fun getCommandsMap(): MutableMap<String, Int> {
    return mutableMapOf(
      "create" to Commands.CREATE.ordinal,
      "loadSource" to Commands.LOAD_SOURCE.ordinal,
      "unload" to Commands.UNLOAD.ordinal,
      "play" to Commands.PLAY.ordinal,
      "pause" to Commands.PAUSE.ordinal,
      "seek" to Commands.SEEK.ordinal,
      "mute" to Commands.MUTE.ordinal,
      "unmute" to Commands.UNMUTE.ordinal,
      "destroy" to Commands.DESTROY.ordinal,
      "setVolume" to Commands.SET_VOLUME.ordinal,
    )
  }

  /**
   * Callback triggered in response to command dispatches from the js side.
   * @param root Root native view of the targeted component.
   * @param commandId Command number identifier. It's a number even though RN sends it as a string.
   * @param args Arguments list sent from the js side.
   */
  override fun receiveCommand(root: RNPlayerView, commandId: String?, args: ReadableArray?) {
    super.receiveCommand(root, commandId, args)
    commandId?.toInt()?.let {
      when(it) {
        Commands.CREATE.ordinal -> create(root, args?.getMap(1))
        Commands.LOAD_SOURCE.ordinal -> loadSource(root, args?.getMap(1))
        Commands.UNLOAD.ordinal -> unload(root)
        Commands.PLAY.ordinal -> play(root)
        Commands.PAUSE.ordinal -> pause(root)
        Commands.SEEK.ordinal -> seek(root, args?.getDouble(1))
        Commands.MUTE.ordinal -> mute(root)
        Commands.UNMUTE.ordinal -> unmute(root)
        Commands.DESTROY.ordinal -> destroy(root)
        Commands.SET_VOLUME.ordinal -> setVolume(root, args?.getInt(1))
        else -> {}
      }
    }
  }

  /**
   * Create or reset the shared native `PlayerView` that bakes the instances
   * of this component on the js side and start bubbling events.
   * @param view Component's native view instance.
   * @param json Configuration options sent from js.
   */
  private fun create(view: RNPlayerView, json: ReadableMap?) {
    val playerConfig = JsonConverter.toPlayerConfig(json)
    if (playerConfig == null) {
      Log.w(javaClass.name, "Failed to convert json to PlayerConfig.\njson -> $json")
      return
    }
    view.addPlayerView(makePlayerView(playerConfig))
    view.startBubblingEvents()
  }

  /**
   * Load the source of the shared native `PlayerView` used by this component.
   * @param view Component's native view instance.
   * @param json Configuration options sent from js.
   */
  private fun loadSource(view: RNPlayerView, json: ReadableMap?) {
    val sourceConfig = JsonConverter.toSourceConfig(json)
    if (sourceConfig != null) {
      view.player?.load(sourceConfig)
      return
    }
    Log.w(javaClass.name, "Failed to convert json to SourceConfig.\njson -> $json")
  }

  /**
   * Call `.unload()` on `view`'s native player source.
   * @param view Component's native view instance.
   */
  private fun unload(view: RNPlayerView) {
    view.player?.unload()
  }

  /**
   * Call `.play()` on `view`'s native player.
   * @param view Component's native view instance.
   */
  private fun play(view: RNPlayerView) {
    view.player?.play()
  }

  /**
   * Call `.pause()` on `view`'s native player.
   * @param view Component's native view instance.
   */
  private fun pause(view: RNPlayerView) {
    view.player?.pause()
  }

  /**
   * Call `.seek(time:)` on `view`'s native player.
   * @param view Component's native view instance.
   * @param time Seek offset in seconds.
   */
  private fun seek(view: RNPlayerView, time: Double?) {
    if (time == null) {
      return
    }
    view.player?.seek(time)
  }

  /**
   * Call `.mute()` on `view`'s native player.
   * @param view Component's native view instance.
   */
  private fun mute(view: RNPlayerView) {
    view.player?.mute()
  }

  /**
   * Call `.unmute()` on `view`'s native player.
   * @param view Component's native view instance.
   */
  private fun unmute(view: RNPlayerView) {
    view.player?.unmute()
  }

  /**
   * Call `.destroy()` on `view`'s native player and stop
   * bubbling events.
   * @param view Component's native view instance.
   */
  private fun destroy(view: RNPlayerView) {
    view.player?.destroy()
    view.stopBubblingEvents()
    view.removePlayerView()
  }

  /**
   * Call `.setVolume(volume:)` on `view`'s native player.
   * @param view Component's native view instance.
   * @param volume Volume level from 0 to 100.
   */
  private fun setVolume(view: RNPlayerView, volume: Int?) {
    if (volume == null) {
      return
    }
    view.player?.volume = volume
  }

  /**
   * Resolves native player's current volume level.
   * @param reactTag Native view id.
   * @param promise JS promise resolver.
   */
  @ReactMethod
  fun getVolume(reactTag: Int, promise: Promise) {
    viewForTag(reactTag) {
      promise.resolve(it.player?.volume)
    }
  }

  /**
   * Resolves the player source from the native view id = `reactTag`.
   * @param reactTag Native view id.
   * @param promise JS promise resolver.
   */
  @ReactMethod
  fun source(reactTag: Int, promise: Promise) {
    viewForTag(reactTag) {
      promise.resolve(JsonConverter.fromSource(it.player?.source))
    }
  }

  /**
   * Resolves native player's current playback time.
   * @param reactTag Native view id.
   * @param mode Current time's time mode.
   * @param promise JS promise resolver.
   */
  @ReactMethod
  fun currentTime(reactTag: Int, mode: String?, promise: Promise) {
    viewForTag(reactTag) {
      var timeOffset: Double = 0.0
      if (mode != null) {
        timeOffset = if (mode == "relative") {
          it.player?.playbackTimeOffsetToRelativeTime ?: 0.0
        } else {
          it.player?.playbackTimeOffsetToAbsoluteTime ?: 0.0
        }
      }
      val currentTime = it.player?.currentTime
      if (currentTime != null) {
        promise.resolve(currentTime + timeOffset)
      }
    }
  }

  /**
   * Resolves native player's playback duration.
   * @param reactTag Native view id.
   * @param promise JS promise resolver.
   */
  @ReactMethod
  fun duration(reactTag: Int, promise: Promise) {
    viewForTag(reactTag) {
      promise.resolve(it.player?.duration)
    }
  }

  /**
   * Resolves native player's isMuted state.
   * @param reactTag Native view id.
   * @param promise JS promise resolver.
   */
  @ReactMethod
  fun isMuted(reactTag: Int, promise: Promise) {
    viewForTag(reactTag) {
      promise.resolve(it.player?.isMuted)
    }
  }

  /**
   * Resolves native player's isPlaying state.
   * @param reactTag Native view id.
   * @param promise JS promise resolver.
   */
  @ReactMethod
  fun isPlaying(reactTag: Int, promise: Promise) {
    viewForTag(reactTag) {
      promise.resolve(it.player?.isPlaying)
    }
  }

  /**
   * Resolves native player's isPaused state.
   * @param reactTag Native view id.
   * @param promise JS promise resolver.
   */
  @ReactMethod
  fun isPaused(reactTag: Int, promise: Promise) {
    viewForTag(reactTag) {
      promise.resolve(it.player?.isPaused)
    }
  }

  /**
   * Resolves native player's isLive state.
   * @param reactTag Native view id.
   * @param promise JS promise resolver.
   */
  @ReactMethod
  fun isLive(reactTag: Int, promise: Promise) {
    viewForTag(reactTag) {
      promise.resolve(it.player?.isLive)
    }
  }

  /**
   * Fetch a native view instance registered inside RN's UIManager using
   * some `reactTag` as id.
   * @param reactTag Id indexing some native view inside RN's UIManager.
   * @param callback Function called with the fetched view.
   */
  private fun viewForTag(reactTag: Int, callback: (RNPlayerView) -> Unit) {
    val uiManager = context.getNativeModule(UIManagerModule::class.java)
    val view = uiManager?.resolveView(reactTag)
    if (view != null && view is RNPlayerView) {
      view.post(Runnable { callback(view) })
    }
  }

  /**
   * Shared `PlayerView` instance used by all `<NativePlayerView ... />` components
   * from react. By design, each component must have their own native view instance
   * which is handled by RN. For that, `RNPlayerView` is used as a view wrapper for this
   * shared view, but its setup is handled via the `create/destroy` commands instead.
   */
  private var sharedPlayerView: PlayerView? = null

  /**
   * Activity lifecycle listener callbacks.
   */
  override fun onHostPause() {
    sharedPlayerView?.onPause()
  }

  override fun onHostResume() {
    sharedPlayerView?.onResume()
  }

  override fun onHostDestroy() {
    sharedPlayerView?.onDestroy()
  }

  /**
   * Reset the configuration of the shared player view instance. Also, create
   * a new one if none exists yet.
   * @return The shared player view instance.
   */
  private fun makePlayerView(config: PlayerConfig): PlayerView {
    val newPlayer = Player.create(context, config)
    if (sharedPlayerView == null) {
      sharedPlayerView = PlayerView(context, newPlayer)
      sharedPlayerView?.layoutParams = LinearLayout.LayoutParams(
        LinearLayout.LayoutParams.MATCH_PARENT,
        LinearLayout.LayoutParams.MATCH_PARENT)
    } else {
      sharedPlayerView?.player?.destroy()
      sharedPlayerView?.player = null
      sharedPlayerView?.player = newPlayer
    }
    return sharedPlayerView as PlayerView
  }
}