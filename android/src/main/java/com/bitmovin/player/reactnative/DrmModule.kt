package com.bitmovin.player.reactnative

import android.util.Base64
import com.bitmovin.player.api.drm.PrepareLicenseCallback
import com.bitmovin.player.api.drm.PrepareMessageCallback
import com.bitmovin.player.reactnative.converter.toWidevineConfig
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.exception.CodedException
import expo.modules.kotlin.jni.JavaScriptFunction
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import expo.modules.kotlin.sharedobjects.SharedObject

class SharedDrm(appContext: AppContext, config: Map<String, Any?>, callback: JavaScriptFunction<Any?>?) :
    SharedObject(appContext) {
    private val callbacks = CallbackScope(appContext, callback)
    val config = requireNotNull(config.toWidevineConfig()) { "Invalid widevine config" }.apply {
        val widevine = config["widevine"] as? Map<*, *>
        if (widevine?.containsKey("prepareMessage") == true) {
            prepareMessageCallback = PrepareMessageCallback { prepare("prepareMessage", it) }
        }
        if (widevine?.containsKey("prepareLicense") == true) {
            prepareLicenseCallback = PrepareLicenseCallback { prepare("prepareLicense", it) }
        }
    }
    private fun prepare(operation: String, data: ByteArray): ByteArray {
        val result = callbacks.call(operation, listOf(Base64.encodeToString(data, Base64.NO_WRAP)), 5000)
        return Base64.decode(result as? String ?: "", Base64.NO_WRAP)
    }
    fun destroy() = callbacks.close()
    override fun sharedObjectDidRelease() = destroy()
}

class DrmModule : Module() {
    private fun create(config: Map<String, Any?>, callback: JavaScriptFunction<Any?>?): SharedDrm =
        try {
            SharedDrm(appContext, config, callback)
        } catch (error: Exception) {
            throw CodedException("DrmError", "Failed to initialize DRM config", error)
        }

    override fun definition() = ModuleDefinition {
        Name("DrmModule")
        Function("create") { config: Map<String, Any?>, callback: JavaScriptFunction<Any?>? ->
            create(config, callback)
        }
        Class(SharedDrm::class) {
            Constructor { config: Map<String, Any?>, callback: JavaScriptFunction<Any?>? ->
                create(config, callback)
            }
            AsyncFunction("destroy") { owner: SharedDrm -> owner.destroy() }
        }
    }
}
