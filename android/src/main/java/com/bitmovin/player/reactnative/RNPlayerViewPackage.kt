package com.bitmovin.player.reactnative

import android.view.View
import com.bitmovin.player.reactnative.ui.CustomMessageHandlerModule
import com.bitmovin.player.reactnative.ui.FullscreenHandlerModule
import com.facebook.react.ReactPackage
import com.facebook.react.bridge.*
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
        return mutableListOf(
            OfflineModule(reactContext),
            UuidModule(reactContext),
            PlayerModule(reactContext),
            SourceModule(reactContext),
            DrmModule(reactContext),
            PlayerAnalyticsModule(reactContext),
            RNPlayerViewManager(reactContext),
            FullscreenHandlerModule(reactContext),
            CustomMessageHandlerModule(reactContext),
            BitmovinCastManagerModule(reactContext),
            BufferModule(reactContext),
            AdaptationModule(reactContext),
            NetworkModule(reactContext),
            DebugModule(reactContext),
        )
    }

    /**
     * Register `RNPlayerViewManager` as a view manager. This allows creating
     * native component instances with `<NativePlayerView {...} />` on the js
     * side.
     */
    override fun createViewManagers(
        reactContext: ReactApplicationContext,
    ): MutableList<ViewManager<out View, out ReactShadowNode<*>>> {
        return mutableListOf(RNPlayerViewManager(reactContext))
    }
}
