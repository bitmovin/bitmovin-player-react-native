package com.bitmovin.player.reactnative

import com.bitmovin.player.api.DebugConfig
import com.facebook.react.bridge.*
import com.facebook.react.module.annotations.ReactModule

private const val MODULE_NAME = "DebugModule"

@ReactModule(name = MODULE_NAME)
class DebugModule(context: ReactApplicationContext) : BitmovinBaseModule(context) {
    override fun getName() = MODULE_NAME

    /**
     * Enable/disable verbose logging for the console logger.
     * @param enabled Whether to set verbose logging as enabled or disabled.
     */
    @ReactMethod
    fun setDebugLoggingEnabled(enabled: Boolean, promise: Promise) {
        promise.unit.resolveOnUiThread {
            DebugConfig.isLoggingEnabled = enabled
        }
    }
}
