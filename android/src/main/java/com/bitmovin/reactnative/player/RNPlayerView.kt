package com.bitmovin.reactnative.player

import android.widget.LinearLayout
import com.bitmovin.player.PlayerView
import com.bitmovin.player.api.Player
import com.bitmovin.player.api.event.PlayerEvent
import com.bitmovin.player.api.event.on
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContext
import com.facebook.react.bridge.WritableMap
import com.facebook.react.uimanager.events.RCTEventEmitter
import com.facebook.react.uimanager.events.RCTModernEventEmitter

class RNPlayerView(context: ReactApplicationContext) : LinearLayout(context) {
  private var playerView: PlayerView? = null
  var player: Player?
    get() = playerView?.player
    set(value) {
      playerView?.player = value
    }

  fun addPlayerView(playerView: PlayerView) {
    this.playerView = playerView
    addView(playerView)
  }

  // events
  private fun emitEvent(event: String, json: WritableMap?) {
    val reactContext = context as ReactContext
    reactContext.getJSModule(RCTEventEmitter::class.java).receiveEvent(id, event, json)
  }

  private val onReady: (PlayerEvent.Ready) -> Unit = {
    val json = Arguments.createMap()
    json.putString("name", "on${it.javaClass.simpleName}")
    json.putDouble("timestamp", it.timestamp.toDouble())
    emitEvent("ready", json)
  }

  fun registerEvents() {
    player?.on(onReady)
  }

  fun unregisterEvents() {
    player?.off(onReady)
  }

  // sync with react layout
  override fun requestLayout() {
    super.requestLayout()
    post(measureAndLayout)
  }

  private val measureAndLayout = Runnable {
    measure(
      MeasureSpec.makeMeasureSpec(width, MeasureSpec.EXACTLY),
      MeasureSpec.makeMeasureSpec(height, MeasureSpec.EXACTLY))
    layout(left, top, right, bottom)
  }
}