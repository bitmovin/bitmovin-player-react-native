package com.bitmovin.player.reactnative

import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import java.util.*

class UUIDModule(context: ReactApplicationContext) : ReactContextBaseJavaModule(context) {
    /**
     * Exported JS module name.
     */
    override fun getName() = "UUIDModule"

    /**
     * Synchronously generate a random UUIDv4.
     * @return Random UUID RFC 4122 version 4.
     */
    @ReactMethod(isBlockingSynchronousMethod = true)
    fun generate() = UUID.randomUUID().toString()
}