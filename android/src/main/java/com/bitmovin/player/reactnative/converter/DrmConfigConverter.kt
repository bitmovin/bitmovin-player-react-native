package com.bitmovin.player.reactnative.converter

import android.util.Base64
import com.bitmovin.player.api.drm.PrepareLicenseCallback
import com.bitmovin.player.api.drm.PrepareMessageCallback
import com.bitmovin.player.api.drm.WidevineConfig
import com.bitmovin.player.reactnative.CallbackScope

fun Map<String, Any?>.toWidevineConfig(callbacks: CallbackScope, path: String): WidevineConfig =
    requireNotNull(toWidevineConfig()) { "Invalid widevine config" }.apply {
        val config = this@toWidevineConfig
        val widevine = config["widevine"] as? Map<*, *>
        if (widevine?.containsKey("prepareMessage") == true) {
            prepareMessageCallback = PrepareMessageCallback { callbacks.prepare("$path.widevine.prepareMessage", it) }
        }
        if (widevine?.containsKey("prepareLicense") == true) {
            prepareLicenseCallback = PrepareLicenseCallback { callbacks.prepare("$path.widevine.prepareLicense", it) }
        }
    }
private fun CallbackScope.prepare(operation: String, data: ByteArray): ByteArray {
    val result = call(operation, listOf(Base64.encodeToString(data, Base64.NO_WRAP)), 5000)
    return Base64.decode(result as? String ?: "", Base64.NO_WRAP)
}
