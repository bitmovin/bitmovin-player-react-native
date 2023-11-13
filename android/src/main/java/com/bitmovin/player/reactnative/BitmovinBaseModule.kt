package com.bitmovin.player.reactnative

import com.bitmovin.player.reactnative.extensions.offlineModule
import com.bitmovin.player.reactnative.extensions.playerModule
import com.bitmovin.player.reactnative.extensions.sourceModule
import com.bitmovin.player.reactnative.extensions.uiManagerModule
import com.facebook.react.bridge.*
import com.facebook.react.uimanager.UIManagerModule

abstract class BitmovinBaseModule(
    protected val context: ReactApplicationContext,
) : ReactContextBaseJavaModule(context) {
    /** Run [block] in [UIManagerModule.addUIBlock], forwarding the result to the [promise]. */
    protected inline fun <T> addUIBlock(promise: Promise, crossinline block: () -> T) {
        val uiManager = runAndRejectOnException(promise) { uiManager() } ?: return
        uiManager.addUIBlock {
            runAndRejectOnException(promise) {
                promise.resolve(block())
            }
        }
    }

    /**
     * Helper function that gets the instantiated [PlayerModule] from modules registry.
     */
    protected fun playerModule(): PlayerModule =
        context.playerModule ?: throw IllegalArgumentException("PlayerModule not found")

    /**
     * Helper function that returns the initialized [UIManagerModule] instance or throw.
     */
    protected fun uiManager(): UIManagerModule =
        context.uiManagerModule ?: throw IllegalStateException("UIManager not found")

    /**
     * Helper function that returns the initialized [SourceModule] instance or throw.
     */
    protected fun sourceModule(): SourceModule =
        context.sourceModule ?: throw IllegalStateException("SourceModule not found")

    /**
     * Helper function that returns the initialized [OfflineModule] instance or throw.
     */
    protected fun offlineModule(): OfflineModule =
        context.offlineModule ?: throw IllegalStateException("OfflineModule not found")
}

/** Run [block], forwarding the return value. If it throws, sets [Promise.reject] and return null. */
inline fun <T> runAndRejectOnException(promise: Promise, crossinline block: () -> T): T? = try {
    block()
} catch (e: Exception) {
    promise.reject(e)
    null
}
