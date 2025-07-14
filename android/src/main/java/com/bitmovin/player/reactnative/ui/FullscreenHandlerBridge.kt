package com.bitmovin.player.reactnative.ui

import com.bitmovin.player.api.ui.FullscreenHandler
import com.bitmovin.player.reactnative.FullscreenHandlerExpoModule
import com.bitmovin.player.reactnative.NativeId
import com.facebook.react.bridge.ReactApplicationContext

class FullscreenHandlerBridge(
    private val nativeId: NativeId,
    private val expoModule: FullscreenHandlerExpoModule? = null,
) : FullscreenHandler {
    override var isFullscreen = false

    override fun onDestroy() {
        // Do nothing
    }

    override fun onFullscreenExitRequested() {
        expoModule?.requestExitFullscreen(nativeId)
    }

    override fun onFullscreenRequested() {
        expoModule?.requestEnterFullscreen(nativeId)
    }

    override fun onPause() {
        // Do nothing
    }

    override fun onResume() {
        // Do nothing
    }
}
