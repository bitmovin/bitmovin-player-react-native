package com.bitmovin.reactnative

import android.util.Log
import android.view.Choreographer
import android.view.ViewGroup
import android.view.ViewGroup.LayoutParams
import android.widget.LinearLayout
import com.bitmovin.player.PlayerView
import com.bitmovin.player.api.Player
import com.bitmovin.player.api.PlayerConfig
import com.bitmovin.player.api.source.SourceConfig
import com.bitmovin.player.api.source.SourceType
import com.facebook.react.bridge.*
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.ViewGroupManager

enum class PlayerViewCommands {
  CREATE,
  LOAD_SOURCE,
  PLAY,
  DESTROY
}

class PlayerViewManager(private val context: ReactApplicationContext) : ViewGroupManager<LinearLayout>() {
  private var playerView: PlayerView? = null
  override fun getName() = "NativePlayerView"

  override fun createViewInstance(reactContext: ThemedReactContext): LinearLayout {
    return LinearLayout(reactContext)
  }

  override fun getCommandsMap(): MutableMap<String, Int>? {
    return mutableMapOf<String, Int>(
      "create" to PlayerViewCommands.CREATE.ordinal,
      "loadSource" to PlayerViewCommands.LOAD_SOURCE.ordinal,
      "play" to PlayerViewCommands.PLAY.ordinal,
      "destroy" to PlayerViewCommands.DESTROY.ordinal
    )
  }

  override fun receiveCommand(root: LinearLayout, commandId: String?, args: ReadableArray?) {
    super.receiveCommand(root, commandId, args)
    args?.getInt(0)?.let { reactTag ->
      val parent = root.findViewById<LinearLayout>(reactTag)
      commandId?.toInt()?.let {
        when(it) {
          PlayerViewCommands.CREATE.ordinal -> create(parent, args.getInt(0), args.getMap(1))
          PlayerViewCommands.LOAD_SOURCE.ordinal -> loadSource(args.getMap(1))
          PlayerViewCommands.PLAY.ordinal -> play()
          PlayerViewCommands.DESTROY.ordinal -> destroy(parent)
          else -> {}
        }
      }
    }
  }

  fun play() = onMainThread {
    playerView?.player?.play()
  }

  fun destroy(parent: ViewGroup) = onMainThread {
    playerView?.player?.destroy()
    playerView?.player = null
    parent.removeAllViews()
  }

  fun create(parent: ViewGroup, reactTag: Int?, config: ReadableMap?) {
    if (reactTag == null) {
      return
    }
    Log.i(name, "Received player config: $config")
    val playerConfig = PlayerConfig(key = config?.getString("licenseKey"))
    val player = Player.create(context, playerConfig)
    if (playerView != null) {
      playerView?.player = player
    } else {
      playerView = PlayerView(context, player)
      parent.addView(playerView, 0, LayoutParams(LayoutParams.MATCH_PARENT, LayoutParams.MATCH_PARENT))
    }
  }

  fun loadSource(config: ReadableMap?) = onMainThread {
    config?.getString("url")?.let {
      val type = sourceType(config.getString("type"))
      val sourceConfig = SourceConfig(it, type)
      sourceConfig.posterSource = config.getString("poster")
      playerView?.player?.load(sourceConfig)
    }
  }

  @ReactMethod
  fun source(reactTag: Int, promise: Promise) = onMainThread {
    var sourceResponse: ReadableMap? = null
    playerView?.player?.source?.let {
      sourceResponse = Arguments.createMap().apply {
        putDouble("duration", it.duration)
        putBoolean("isActive", it.isActive)
        putBoolean("isAttachedToPlayer", it.isAttachedToPlayer)
        putInt("loadingState", it.loadingState.ordinal)
      }
    }
    promise.resolve(sourceResponse)
  }

  private fun onMainThread(onFrame: (Long) -> Unit) =
    Choreographer.getInstance().postFrameCallback(onFrame)

  private fun sourceType(raw: String?): SourceType = raw.let {
    when(raw) {
      "hls" -> SourceType.Hls
      "dash" -> SourceType.Dash
      "smooth" -> SourceType.Smooth
      else -> SourceType.Dash
    }
  }
}