package com.bitmovin.player.reactnative

import com.bitmovin.player.casting.BitmovinCastManager
import com.bitmovin.player.reactnative.converter.JsonConverter
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.module.annotations.ReactModule
import com.facebook.react.uimanager.UIManagerModule

private const val MODULE_NAME = "BitmovinCastManagerModule"

@ReactModule(name = MODULE_NAME)
class BitmovinCastManagerModule(
    private val context: ReactApplicationContext,
) : ReactContextBaseJavaModule(context) {
    override fun getName() = MODULE_NAME

    /**
     * Returns whether the [BitmovinCastManager] is initialized.
     */
    @ReactMethod
    fun isInitialized(promise: Promise) = uiManager?.addUIBlock {
        promise.resolve(BitmovinCastManager.isInitialized())
    }

    /**
     * Initializes the [BitmovinCastManager] with the given options.
     */
    @ReactMethod
    fun initializeCastManager(options: ReadableMap?, promise: Promise) {
        val castOptions = JsonConverter.toCastOptions(options)
        uiManager?.addUIBlock {
            BitmovinCastManager.initialize(
                castOptions?.applicationId,
                castOptions?.messageNamespace,
            )
            promise.resolve(null)
        }
    }

    /**
     * Sends a message to the receiver.
     */
    @ReactMethod
    fun sendMessage(message: String, messageNamespace: String?, promise: Promise) {
        uiManager?.addUIBlock {
            BitmovinCastManager.getInstance().sendMessage(message, messageNamespace)
            promise.resolve(null)
        }
    }

    /**
     * Updates the context of the [BitmovinCastManager] to the current activity.
     */
    @ReactMethod
    fun updateContext(promise: Promise) {
        uiManager?.addUIBlock {
            BitmovinCastManager.getInstance().updateContext(currentActivity)
            promise.resolve(null)
        }
    }

    private val uiManager: UIManagerModule?
        get() = context.getNativeModule(UIManagerModule::class.java)
}

/**
 * Represents configuration options for the [BitmovinCastManager].
 */
data class BitmovinCastManagerOptions(
    val applicationId: String? = null,
    val messageNamespace: String? = null,
)
