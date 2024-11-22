package com.bitmovin.player.reactnative

import com.bitmovin.player.api.DebugConfig
import com.facebook.react.bridge.*
import com.facebook.react.module.annotations.ReactModule

private const val MODULE_NAME = "DebugModule"

@ReactModule(name = MODULE_NAME)
class DebugModule(context: ReactApplicationContext) : BitmovinBaseModule(context) {
    override fun getName() = MODULE_NAME

    // TODO: docs
    @ReactMethod
    fun setLoggingEnabled(enabled: Boolean, promise: Promise) {
        promise.unit.resolveOnUiThread {
            DebugConfig.isLoggingEnabled = enabled
        }
    }
}