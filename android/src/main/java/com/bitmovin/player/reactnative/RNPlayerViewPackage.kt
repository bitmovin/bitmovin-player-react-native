package com.bitmovin.player.reactnative

// LEGACY PACKAGE - NO LONGER USED IN EXPO MODULES ARCHITECTURE
// This file is kept for reference only. All modules have been migrated to Expo modules.
// The registration is now handled by ExpoModulesCore automatically.

/*
import android.view.View
import com.bitmovin.player.reactnative.ui.CustomMessageHandlerModule
import com.bitmovin.player.reactnative.ui.FullscreenHandlerModule
import com.facebook.react.ReactPackage
import com.facebook.react.bridge.*
import com.facebook.react.uimanager.ReactShadowNode
import com.facebook.react.uimanager.ViewManager

/**
 * React package registry.
 *
 * NOTE: This class is no longer used in the Expo modules architecture.
 * All modules are now automatically registered by ExpoModulesCore.
 */
class RNPlayerViewPackage : ReactPackage {
    /**
     * Register modules as React Native modules - replaced by Expo modules.
     */
    override fun createNativeModules(reactContext: ReactApplicationContext): MutableList<NativeModule> {
        // All modules migrated to Expo:
        // - OfflineModule -> OfflineExpoModule
        // - PlayerModule -> PlayerExpoModule
        // - SourceModule -> SourceExpoModule
        // - DrmModule -> DrmExpoModule
        // - etc.
        return mutableListOf()
    }

    /**
     * Register view managers - replaced by Expo ViewManager.
     */
    override fun createViewManagers(
        reactContext: ReactApplicationContext,
    ): MutableList<ViewManager<out View, out ReactShadowNode<*>>> {
        // RNPlayerViewManager -> RNPlayerViewManagerExpo
        return mutableListOf()
    }
}
*/
