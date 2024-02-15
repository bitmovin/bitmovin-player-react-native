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
    fun isInitialized(promise: Promise) = promise.unit.resolveOnUiThread {
        BitmovinCastManager.isInitialized()
    }

    /**
     * Initializes the [BitmovinCastManager] with the given options.
     */
    @ReactMethod
    fun initializeCastManager(options: ReadableMap?, promise: Promise) = promise.unit.resolveOnUiThread {
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
    fun sendMessage(message: String, messageNamespace: String?, promise: Promise) = promise.unit.resolveOnUiThread {
        BitmovinCastManager.getInstance().sendMessage(message, messageNamespace)
    }

    /**
     * Updates the context of the [BitmovinCastManager] to the current activity.
     */
    @ReactMethod
    fun updateContext(promise: Promise) = promise.unit.resolveOnUiThread {
        BitmovinCastManager.getInstance().updateContext(currentActivity)
    }

    /**
     * Opens the cast dialog, for selecting and starting a cast session.
     */
    @ReactMethod
    fun showDialog(promise: Promise) = promise.unit.resolveOnUiThread {
        BitmovinCastManager.getInstance().showDialog()
    }

    /**
     * Disconnects from the current cast session.
     */
    @ReactMethod
    fun disconnect(promise: Promise) = promise.unit.resolveOnUiThread {
        BitmovinCastManager.getInstance().disconnect()
    }
}

/**
 * Represents configuration options for the [BitmovinCastManager].
 */
data class BitmovinCastManagerOptions(
    val applicationId: String? = null,
    val messageNamespace: String? = null,
)
