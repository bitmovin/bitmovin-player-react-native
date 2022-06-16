package com.bitmovin.reactnative.player

import android.util.Log
import com.bitmovin.reactnative.converter.JsonConverter
import com.facebook.react.bridge.*
import com.facebook.react.uimanager.SimpleViewManager
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.UIManagerModule

enum class PlayerViewCommands {
  CREATE,
  LOAD_SOURCE,
  PLAY,
  DESTROY
}

class RNPlayerViewManager(private val context: ReactApplicationContext) : SimpleViewManager<RNPlayerView>() {
  override fun getName() = "NativePlayerView"

  override fun createViewInstance(reactContext: ThemedReactContext): RNPlayerView {
    return RNPlayerView(context)
  }

  override fun getCommandsMap(): MutableMap<String, Int>? {
    return mutableMapOf<String, Int>(
      "create" to PlayerViewCommands.CREATE.ordinal,
      "loadSource" to PlayerViewCommands.LOAD_SOURCE.ordinal,
      "play" to PlayerViewCommands.PLAY.ordinal,
      "destroy" to PlayerViewCommands.DESTROY.ordinal
    )
  }

  override fun receiveCommand(root: RNPlayerView, commandId: String?, args: ReadableArray?) {
    super.receiveCommand(root, commandId, args)
    commandId?.toInt()?.let {
      when(it) {
        PlayerViewCommands.CREATE.ordinal -> create(root, args?.getMap(1))
        PlayerViewCommands.LOAD_SOURCE.ordinal -> loadSource(root, args?.getMap(1))
        PlayerViewCommands.PLAY.ordinal -> play(root)
        PlayerViewCommands.DESTROY.ordinal -> destroy(root)
        else -> {}
      }
    }
  }

  // Command methods
  private fun create(view: RNPlayerView, json: ReadableMap?) {
    val playerConfig = JsonConverter.toPlayerConfig(json)
    if (playerConfig == null) {
      Log.w(javaClass.name, "Failed to converter json to PlayerConfig.\njson -> $json")
      return
    }
    view.create(playerConfig)
  }

  private fun loadSource(view: RNPlayerView, json: ReadableMap?) {
    val sourceConfig = JsonConverter.toSourceConfig(json)
    if (sourceConfig != null) {
      view.player?.load(sourceConfig)
      return
    }
    Log.w(javaClass.name, "Failed to converter json to SourceConfig.\njson -> $json")
  }

  private fun play(view: RNPlayerView) {
    view.player?.play()
  }

  private fun destroy(view: RNPlayerView) {
    view.player?.destroy()
  }

  // Module method exports
  @ReactMethod
  fun source(reactTag: Int, promise: Promise) {
    viewForTag(reactTag) {
      promise.resolve(JsonConverter.fromSource(it.player?.source))
    }
  }

  private fun viewForTag(reactTag: Int, callback: (RNPlayerView) -> Unit) {
    val uiManager = context.getNativeModule(UIManagerModule::class.java)
    val view = uiManager?.resolveView(reactTag)
    if (view != null && view is RNPlayerView) {
      view.post(Runnable { callback(view) })
    }
  }
}