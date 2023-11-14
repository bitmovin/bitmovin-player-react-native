package com.bitmovin.player.reactnative

import com.bitmovin.player.casting.BitmovinCastManager
import com.bitmovin.player.reactnative.converter.toCastOptions
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.module.annotations.ReactModule

private const val MODULE_NAME = "BitmovinCastManagerModule"

@ReactModule(name = MODULE_NAME)
class BitmovinCastManagerModule(context: ReactApplicationContext) : BitmovinBaseModule(context) {
    override fun getName() = MODULE_NAME

    /**
     * Returns whether the [BitmovinCastManager] is initialized.
     */
    @ReactMethod
    fun isInitialized(promise: Promise) = promise.resolveOnUIThread {
        BitmovinCastManager.isInitialized()
    }

    /**
     * Initializes the [BitmovinCastManager] with the given options.
     */
    @ReactMethod
    fun initializeCastManager(options: ReadableMap?, promise: Promise) = promise.resolveOnUIThread {
        val castOptions = options?.toCastOptions()
        BitmovinCastManager.initialize(
            castOptions?.applicationId,
            castOptions?.messageNamespace,
        )
    }

    /**
     * Sends a message to the receiver.
     */
    @ReactMethod
    fun sendMessage(message: String, messageNamespace: String?, promise: Promise) = promise.resolveOnUIThread {
        BitmovinCastManager.getInstance().sendMessage(message, messageNamespace)
    }

    /**
     * Updates the context of the [BitmovinCastManager] to the current activity.
     */
    @ReactMethod
    fun updateContext(promise: Promise) = promise.resolveOnUIThread {
        BitmovinCastManager.getInstance().updateContext(currentActivity)
    }
}

/**
 * Represents configuration options for the [BitmovinCastManager].
 */
data class BitmovinCastManagerOptions(
    val applicationId: String? = null,
    val messageNamespace: String? = null,
)
