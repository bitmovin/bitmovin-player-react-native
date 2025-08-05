package com.bitmovin.player.reactnative.ui

import com.bitmovin.player.api.ui.FullscreenHandler
import com.bitmovin.player.reactnative.FullscreenHandlerModule
import com.bitmovin.player.reactnative.NativeId

class FullscreenHandlerBridge(
    private val nativeId: NativeId,
    private val module: FullscreenHandlerModule? = null,
) : FullscreenHandler {
    override var isFullscreen = false

    override fun onDestroy() {
        // Do nothing
    }

    override fun onFullscreenExitRequested() {
        module?.requestExitFullscreen(nativeId)
    }

    override fun onFullscreenRequested() {
        module?.requestEnterFullscreen(nativeId)
    }

    override fun onPause() {
        // Do nothing
    }

    override fun onResume() {
        // Do nothing
    }
}
