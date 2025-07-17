package com.bitmovin.player.reactnative

import com.bitmovin.player.reactnative.ui.FullscreenHandlerBridge
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

/**
 * Expo module for FullscreenHandler management with bidirectional communication.
 * Handles synchronous fullscreen state changes between native code and JavaScript.
 */
class FullscreenHandlerModule : Module() {
    /**
     * In-memory mapping from `nativeId`s to `FullscreenHandlerBridge` instances.
     */
    private val fullscreenHandlers: Registry<FullscreenHandlerBridge> = mutableMapOf()

    /**
     * ResultWaiter used for blocking thread while waiting for fullscreen state change
     */
    private val waiter = ResultWaiter<Boolean>()

    override fun definition() = ModuleDefinition {
        Name("FullscreenHandlerModule")

        Events("onEnterFullscreen", "onExitFullscreen")

        AsyncFunction("registerHandler") { nativeId: String ->
            if (fullscreenHandlers[nativeId] == null) {
                fullscreenHandlers[nativeId] = FullscreenHandlerBridge(nativeId, this@FullscreenHandlerModule)
            }
        }

        AsyncFunction("destroy") { nativeId: String ->
            fullscreenHandlers.remove(nativeId)
        }

        AsyncFunction("notifyFullscreenChanged") { id: Int, isFullscreenEnabled: Boolean ->
            waiter.complete(id, isFullscreenEnabled)
        }

        AsyncFunction("setIsFullscreenActive") { nativeId: String, isFullscreenActive: Boolean ->
            fullscreenHandlers[nativeId]?.isFullscreen = isFullscreenActive
        }
    }

    /**
     * Retrieves the FullscreenHandlerBridge instance for the given nativeId.
     * This method maintains the same static access pattern as the legacy module.
     */
    fun getInstance(nativeId: String?): FullscreenHandlerBridge? = fullscreenHandlers[nativeId]

    /**
     * Handles fullscreen enter request from native code.
     * Called by FullscreenHandlerBridge when fullscreen should be entered.
     */
    fun requestEnterFullscreen(nativeId: String) {
        val handler = getInstance(nativeId) ?: return

        val (id, wait) = waiter.make(250) // 250ms timeout

        // Send event to JavaScript
        sendEvent(
            "onEnterFullscreen",
            mapOf(
                "nativeId" to nativeId,
                "id" to id,
            ),
        )

        val result = wait() ?: return
        handler.isFullscreen = result
    }

    /**
     * Handles fullscreen exit request from native code.
     * Called by FullscreenHandlerBridge when fullscreen should be exited.
     */
    fun requestExitFullscreen(nativeId: String) {
        val handler = getInstance(nativeId) ?: return

        val (id, wait) = waiter.make(250) // 250ms timeout

        // Send event to JavaScript
        sendEvent(
            "onExitFullscreen",
            mapOf(
                "nativeId" to nativeId,
                "id" to id,
            ),
        )

        val result = wait() ?: return
        handler.isFullscreen = result
    }
}
