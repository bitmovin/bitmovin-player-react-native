package com.bitmovin.reactnative

import android.view.View
import com.facebook.react.uimanager.SimpleViewManager
import com.facebook.react.uimanager.ThemedReactContext

class PlayerViewManager : SimpleViewManager<View>() {
  override fun getName() = "NativePlayerView"

  override fun createViewInstance(reactContext: ThemedReactContext): View {
    return View(reactContext)
  }
}