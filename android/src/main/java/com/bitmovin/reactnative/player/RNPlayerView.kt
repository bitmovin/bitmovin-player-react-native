package com.bitmovin.reactnative.player

import android.annotation.SuppressLint
import android.view.ViewGroup
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
import java.lang.ref.WeakReference

/**
 * Native view wrapper for component instances. It both serves as the main view
 * handled by RN (the actual player view is handled by the RNPlayerViewManager) and
 * exposes player events as bubbling events.
 */
@SuppressLint("ViewConstructor")
class RNPlayerView(context: ReactApplicationContext) : LinearLayout(context) {
  /**
   * Reference to the shared player view set as child.
   */
  private lateinit var playerView: WeakReference<PlayerView>

  /**
   * Handy property accessor for `playerView`'s player instance.
   */
  var player: Player?
    get() = playerView.get()?.player
    set(value) {
      playerView.get()?.player = value
    }

  /**
   * Set the given `playerView` as child.
   * @param playerView Shared player view instance.
   */
  fun addPlayerView(playerView: PlayerView) {
    this.playerView = WeakReference(playerView)
    if (playerView.parent != null) {
      (playerView.parent as ViewGroup).removeView(playerView)
    }
    addView(playerView)
  }

  /**
   * Remove the currently associated `playerView` instance
   * from this view hierarchy and cleanup its reference.
   */
  fun removePlayerView() {
    if (playerView.get() != null) {
      removeView(playerView.get())
    }
    player = null
    playerView.clear()
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
        MeasureSpec.makeMeasureSpec(height, MeasureSpec.EXACTLY))
      layout(left, top, right, bottom)
    }
  }

  /**
   * `onReady` event callback.
   */
  private val onReady: (PlayerEvent.Ready) -> Unit = {
    val json = Arguments.createMap()
    json.putString("name", "on${it.javaClass.simpleName}")
    json.putDouble("timestamp", it.timestamp.toDouble())
    emitEvent("ready", json)
  }

  /**
   * Start listening and emitting player events as bubbling events to the js side.
   */
  fun startBubblingEvents() {
    player?.on(onReady)
  }

  /**
   * Stop listening for player events and cease to emit bubbling events.
   */
  fun stopBubblingEvents() {
    player?.off(onReady)
  }

  /**
   * Emits a bubbling event with payload to js.
   * @param event Native event name.
   * @param json Optional js object to be sent as payload.
   */
  private fun emitEvent(event: String, json: WritableMap?) {
    val reactContext = context as ReactContext
    reactContext
      .getJSModule(RCTEventEmitter::class.java)
      .receiveEvent(id, event, json)
  }
}