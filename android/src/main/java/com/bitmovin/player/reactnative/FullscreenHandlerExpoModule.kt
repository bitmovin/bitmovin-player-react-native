package com.bitmovin.player.reactnative

import com.bitmovin.player.reactnative.ui.FullscreenHandlerBridge
import com.facebook.react.bridge.*
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import java.util.concurrent.locks.ReentrantLock
import kotlin.concurrent.withLock

private const val MODULE_NAME = "FullscreenHandlerExpoModule"

/**
 * Expo module for FullscreenHandler management with bidirectional communication.
 * Handles synchronous fullscreen state changes between native code and JavaScript.
 */
class FullscreenHandlerExpoModule : Module() {
    /**
     * In-memory mapping from `nativeId`s to `FullscreenHandlerBridge` instances.
     */
    private val fullscreenHandlers: Registry<FullscreenHandlerBridge> = mutableMapOf()

    /**
     * Module's local lock object used to sync calls between Kotlin and JS.
     */
    private val lock = ReentrantLock()

    /**
     * Lock condition used to sync operations on the fullscreen handler.
     */
    private val fullscreenChangedCondition = lock.newCondition()

    override fun definition() = ModuleDefinition {
        Name(MODULE_NAME)

        AsyncFunction("registerHandler") { nativeId: String ->
            val fullscreenHandler = fullscreenHandlers[nativeId] ?: FullscreenHandlerBridge(appContext.reactContext as com.facebook.react.bridge.ReactApplicationContext, nativeId, this@FullscreenHandlerExpoModule)
            fullscreenHandlers[nativeId] = fullscreenHandler
        }

        AsyncFunction("destroy") { nativeId: String ->
            fullscreenHandlers.remove(nativeId)
        }

        AsyncFunction("notifyFullscreenChanged") { nativeId: String, isFullscreenEnabled: Boolean ->
            fullscreenHandlers[nativeId]?.isFullscreen = isFullscreenEnabled
            lock.withLock {
                fullscreenChangedCondition.signal()
            }
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
        // Call JavaScript function directly using React Native bridge
        appContext.reactContext?.let { context ->
            (context as ReactApplicationContext).catalystInstance.callFunction(
                "FullscreenBridge-$nativeId",
                "enterFullscreen",
                Arguments.createArray() as NativeArray
            )
        }
        
        lock.withLock {
            fullscreenChangedCondition.await()
        }
    }

    /**
     * Handles fullscreen exit request from native code.
     * Called by FullscreenHandlerBridge when fullscreen should be exited.
     */
    fun requestExitFullscreen(nativeId: String) {
        // Call JavaScript function directly using React Native bridge
        appContext.reactContext?.let { context ->
            (context as ReactApplicationContext).catalystInstance.callFunction(
                "FullscreenBridge-$nativeId",
                "exitFullscreen",
                Arguments.createArray() as NativeArray
            )
        }
        
        lock.withLock {
            fullscreenChangedCondition.await()
        }
    }

    companion object {
        /**
         * Static access method to maintain compatibility with other modules.
         * Retrieves the FullscreenHandlerBridge for the given nativeId.
         */
        @JvmStatic
        fun getFullscreenHandlerBridge(nativeId: String): FullscreenHandlerBridge? {
            // TODO: Implement global registry pattern if needed by other modules
            return null
        }
    }
}