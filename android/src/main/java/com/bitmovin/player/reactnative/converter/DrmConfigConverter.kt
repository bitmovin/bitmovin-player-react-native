package com.bitmovin.player.reactnative.converter

import android.util.Base64
import com.bitmovin.player.api.drm.PrepareLicenseCallback
import com.bitmovin.player.api.drm.PrepareMessageCallback
import com.bitmovin.player.api.drm.WidevineConfig
import com.bitmovin.player.reactnative.CallbackScope
import com.bitmovin.player.reactnative.extensions.getMap
import com.bitmovin.player.reactnative.extensions.getString
import com.bitmovin.player.reactnative.extensions.withBoolean
import com.bitmovin.player.reactnative.extensions.withMap
import com.bitmovin.player.reactnative.extensions.withString

fun Map<String, Any?>.toWidevineConfig(callbacks: CallbackScope, path: String): WidevineConfig? =
    getMap("widevine")?.run {
        WidevineConfig(getString("licenseUrl")).apply {
            withString("preferredSecurityLevel") { preferredSecurityLevel = it }
            withBoolean("shouldKeepDrmSessionsAlive") { shouldKeepDrmSessionsAlive = it }
            withMap("httpHeaders") { httpHeaders = it.mapValues { entry -> entry.value as String }.toMutableMap() }
            if (containsKey("prepareMessage")) {
                prepareMessageCallback = PrepareMessageCallback {
                    callbacks.prepare("$path.widevine.prepareMessage", it)
                }
            }
            if (containsKey("prepareLicense")) {
                prepareLicenseCallback = PrepareLicenseCallback {
                    callbacks.prepare("$path.widevine.prepareLicense", it)
                }
            }
        }
    }
private fun CallbackScope.prepare(operation: String, data: ByteArray): ByteArray {
    val result = call(operation, listOf(Base64.encodeToString(data, Base64.NO_WRAP)))
    return Base64.decode(result as? String ?: "", Base64.NO_WRAP)
}
