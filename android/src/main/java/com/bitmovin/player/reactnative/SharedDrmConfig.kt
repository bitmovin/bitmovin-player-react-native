package com.bitmovin.player.reactnative

import android.util.Base64
import com.bitmovin.player.api.drm.PrepareLicenseCallback
import com.bitmovin.player.api.drm.PrepareMessageCallback
import com.bitmovin.player.reactnative.converter.toWidevineConfig
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.jni.JavaScriptFunction
import expo.modules.kotlin.jni.JavaScriptValue
import expo.modules.kotlin.sharedobjects.SharedObject

class SharedDrmConfig(
    appContext: AppContext,
    config: Map<String, Any?>,
    callback: JavaScriptFunction<JavaScriptValue>?,
) : SharedObject(appContext) {
    private val callbacks = CallbackScope(appContext, callback)
    val config = requireNotNull(config.toWidevineConfig()) { "Invalid widevine config" }.apply {
        val widevine = config["widevine"] as? Map<*, *>
        if (widevine?.containsKey("prepareMessage") == true) {
            prepareMessageCallback = PrepareMessageCallback { prepare("widevine.prepareMessage", it) }
        }
        if (widevine?.containsKey("prepareLicense") == true) {
            prepareLicenseCallback = PrepareLicenseCallback { prepare("widevine.prepareLicense", it) }
        }
    }
    private fun prepare(operation: String, data: ByteArray): ByteArray {
        val result = callbacks.call(operation, listOf(Base64.encodeToString(data, Base64.NO_WRAP)), 5000)
        return Base64.decode(result as? String ?: "", Base64.NO_WRAP)
    }
    fun destroy() = callbacks.close()
    override fun sharedObjectDidRelease() = destroy()
}
