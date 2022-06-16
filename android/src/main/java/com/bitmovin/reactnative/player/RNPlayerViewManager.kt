package com.bitmovin.reactnative.player

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

enum class Commands {
  CREATE,
  LOAD_SOURCE,
  PLAY,
  DESTROY,
  UNLOAD,
}

class RNPlayerViewManager(private val context: ReactApplicationContext) : SimpleViewManager<RNPlayerView>(), LifecycleEventListener {
  override fun getName() = "NativePlayerView"

  override fun initialize() {
    super.initialize()
    context.addLifecycleEventListener(this)
  }

  override fun invalidate() {
    context.removeLifecycleEventListener(this)
    super.invalidate()
  }

  override fun createViewInstance(reactContext: ThemedReactContext): RNPlayerView {
    return RNPlayerView(context)
  }

  override fun getCommandsMap(): MutableMap<String, Int>? {
    return mutableMapOf(
      "create" to Commands.CREATE.ordinal,
      "loadSource" to Commands.LOAD_SOURCE.ordinal,
      "play" to Commands.PLAY.ordinal,
      "destroy" to Commands.DESTROY.ordinal,
      "unload" to Commands.UNLOAD.ordinal,
    )
  }

  override fun receiveCommand(root: RNPlayerView, commandId: String?, args: ReadableArray?) {
    super.receiveCommand(root, commandId, args)
    commandId?.toInt()?.let {
      when(it) {
        Commands.CREATE.ordinal -> create(root, args?.getMap(1))
        Commands.LOAD_SOURCE.ordinal -> loadSource(root, args?.getMap(1))
        Commands.PLAY.ordinal -> play(root)
        Commands.DESTROY.ordinal -> destroy(root)
        Commands.UNLOAD.ordinal -> unload(root)
        else -> {}
      }
    }
  }

  // Command methods
  private fun create(view: RNPlayerView, json: ReadableMap?) {
    val playerConfig = JsonConverter.toPlayerConfig(json)
    if (playerConfig == null) {
      Log.w(javaClass.name, "Failed to convert json to PlayerConfig.\njson -> $json")
      return
    }
    view.addPlayerView(makePlayerView(playerConfig))
  }

  private fun loadSource(view: RNPlayerView, json: ReadableMap?) {
    val sourceConfig = JsonConverter.toSourceConfig(json)
    if (sourceConfig != null) {
      view.player?.load(sourceConfig)
      return
    }
    Log.w(javaClass.name, "Failed to convert json to SourceConfig.\njson -> $json")
  }

  private fun play(view: RNPlayerView) {
    view.player?.play()
  }

  private fun destroy(view: RNPlayerView) {
    view.player?.destroy()
  }

  private fun unload(view: RNPlayerView) {
    view.player?.unload()
  }

  // Module method exports
  @ReactMethod
  fun source(reactTag: Int, promise: Promise) {
    viewForTag(reactTag) {
      promise.resolve(JsonConverter.fromSource(it.player?.source))
    }
  }

  // Shared player view setup
  var sharedPlayerView: PlayerView? = null

  override fun onHostDestroy() {
    sharedPlayerView?.onDestroy()
  }

  override fun onHostPause() {
    sharedPlayerView?.onPause()
  }

  override fun onHostResume() {
    sharedPlayerView?.onResume()
  }

  private fun makePlayerView(config: PlayerConfig): PlayerView {
    val newPlayer = Player.create(context, config)
    if (sharedPlayerView == null) {
      sharedPlayerView = PlayerView(context, newPlayer)
      sharedPlayerView?.layoutParams = LinearLayout.LayoutParams(
        LinearLayout.LayoutParams.MATCH_PARENT,
        LinearLayout.LayoutParams.MATCH_PARENT)
    } else {
      sharedPlayerView?.player = newPlayer
    }
    return sharedPlayerView as PlayerView
  }

  // Utility function for view fetching
  private fun viewForTag(reactTag: Int, callback: (RNPlayerView) -> Unit) {
    val uiManager = context.getNativeModule(UIManagerModule::class.java)
    val view = uiManager?.resolveView(reactTag)
    if (view != null && view is RNPlayerView) {
      view.post(Runnable { callback(view) })
    }
  }
}