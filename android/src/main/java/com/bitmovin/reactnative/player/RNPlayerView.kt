package com.bitmovin.reactnative.player

import android.widget.LinearLayout
import com.bitmovin.player.PlayerView
import com.bitmovin.player.api.Player
import com.bitmovin.player.api.PlayerConfig
import com.facebook.react.bridge.ReactApplicationContext

class RNPlayerView(private val context: ReactApplicationContext) : LinearLayout(context) {
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