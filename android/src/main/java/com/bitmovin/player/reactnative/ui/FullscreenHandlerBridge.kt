package com.bitmovin.player.reactnative.ui

import com.bitmovin.player.api.ui.FullscreenHandler
import com.bitmovin.player.reactnative.NativeId
import com.bitmovin.player.reactnative.extensions.getModule
import com.facebook.react.bridge.ReactApplicationContext

class FullscreenHandlerBridge(
    val context: ReactApplicationContext,
    private val nativeId: NativeId
) : FullscreenHandler {
    override var isFullscreen = false

    override fun onDestroy() {
        // Do nothing
    }

    override fun onFullscreenExitRequested() {
        context
            .getModule<FullscreenHandlerModule>()
            ?.requestExitFullscreen(nativeId)
    }

    override fun onFullscreenRequested() {
        context
            .getModule<FullscreenHandlerModule>()
            ?.requestEnterFullscreen(nativeId)
    }

    override fun onPause() {
        // Do nothing
    }

    override fun onResume() {
        // Do nothing
    }
}