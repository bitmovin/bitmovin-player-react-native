package com.bitmovin.player.reactnative

import android.view.View
import com.facebook.react.ReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.uimanager.ReactShadowNode
import com.facebook.react.uimanager.ViewManager

/**
 * React package registry.
 */
class RNPlayerViewPackage : ReactPackage {
  /**
   * Register `RNPlayerViewManager` as a base react native module. This allows
   * accessing methods on `NativePlayerView` on the js side.
   */
  override fun createNativeModules(reactContext: ReactApplicationContext): MutableList<NativeModule> {
    return mutableListOf(RNPlayerViewManager(reactContext))
  }

  /**
   * Register `RNPlayerViewManager` as a view manager. This allows creating
   * native component instances with `<NativePlayerView {...} />` on the js
   * side.
   */
  override fun createViewManagers(reactContext: ReactApplicationContext): MutableList<ViewManager<out View, out ReactShadowNode<*>>> {
    return mutableListOf(RNPlayerViewManager(reactContext))
  }
}
