package com.bitmovin.player.reactnative

import android.util.Base64
import androidx.core.os.bundleOf
import com.bitmovin.player.api.drm.PrepareLicenseCallback
import com.bitmovin.player.api.drm.PrepareMessageCallback
import com.bitmovin.player.api.drm.WidevineConfig
import com.bitmovin.player.reactnative.converter.toWidevineConfig
import expo.modules.kotlin.Promise
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import java.security.InvalidParameterException

/**
 * Represents some operation that transforms data as bytes.
 */
typealias PrepareCallback = (ByteArray) -> ByteArray

/**
 * Expo module for DRM configuration management with Widevine DRM support.
 * Handles bidirectional communication for DRM preparation callbacks.
 */
class DrmModule : Module() {
    /**
     * In-memory mapping from `nativeId`s to `WidevineConfig` instances.
     */
    private val drmConfigs: Registry<WidevineConfig> = mutableMapOf()

    /**
     * Shared ResultWaiter for all DRM callbacks
     */
    private val waiter = ResultWaiter<String>()

    override fun definition() = ModuleDefinition {
        Name("DrmModule")

        Events("onPrepareMessage", "onPrepareLicense")

        AsyncFunction("initializeWithConfig") { nativeId: String, config: Map<String, Any?>, promise: Promise ->
            if (drmConfigs.containsKey(nativeId)) {
                promise.reject("DrmError", "NativeId already exists $nativeId", null)
                return@AsyncFunction
            }

            try {
                val widevineConfig = config.toWidevineConfig() ?: throw InvalidParameterException(
                    "Invalid widevine config",
                )
                widevineConfig.prepareMessageCallback = buildPrepareMessageCallback(nativeId, config)
                widevineConfig.prepareLicenseCallback = buildPrepareLicense(nativeId, config)
                drmConfigs[nativeId] = widevineConfig
                promise.resolve(null)
            } catch (e: Exception) {
                promise.reject("DrmError", "Failed to initialize DRM config", e)
            }
        }

        AsyncFunction("destroy") { nativeId: String ->
            drmConfigs.remove(nativeId)
        }

        Function("setPreparedMessage") { id: Int, message: String ->
            waiter.complete(id, message)
        }

        Function("setPreparedLicense") { id: Int, license: String ->
            waiter.complete(id, license)
        }

        // iOS-specific methods that return null on Android for compatibility
        AsyncFunction("setPreparedCertificate") { _: String, _: String -> // No-op on Android
        }
        AsyncFunction("setPreparedSyncMessage") { _: String, _: String -> // No-op on Android
        }
        AsyncFunction("setPreparedLicenseServerUrl") { _: String, _: String -> // No-op on Android
        }
        AsyncFunction("setPreparedContentId") { _: String, _: String -> // No-op on Android
        }
    }

    /**
     * Fetches the `WidevineConfig` instance associated with `nativeId` from internal drmConfigs.
     * @param nativeId `WidevineConfig` instance ID.
     * @return The associated `WidevineConfig` instance or `null`.
     */
    fun getConfig(nativeId: String?): WidevineConfig? {
        if (nativeId == null) {
            return null
        }
        return drmConfigs[nativeId]
    }

    /**
     * Initialize the `prepareMessage` block in the [widevineConfig]
     * @param nativeId Instance ID.
     * @param config `DrmConfig` config object sent from JS.
     */
    private fun buildPrepareMessageCallback(nativeId: String, config: Map<String, Any?>): PrepareMessageCallback? {
        if ((config["widevine"] as? Map<*, *>)?.containsKey("prepareMessage") != true) {
            return null
        }
        val prepareMessageCallback = createPrepareCallback(
            nativeId,
            "onPrepareMessage",
            waiter,
        )
        return PrepareMessageCallback(prepareMessageCallback)
    }

    /**
     * Initialize the `prepareLicense` block in the `WidevineConfig` associated with `nativeId`.
     * @param nativeId Instance ID.
     * @param config `DrmConfig` config object sent from JS.
     */
    private fun buildPrepareLicense(nativeId: String, config: Map<String, Any?>): PrepareLicenseCallback? {
        if ((config["widevine"] as? Map<*, *>)?.containsKey("prepareLicense") != true) {
            return null
        }
        val prepareLicense = createPrepareCallback(
            nativeId,
            "onPrepareLicense",
            waiter,
        )
        return PrepareLicenseCallback(prepareLicense)
    }

    /**
     * Creates the body of a preparation callback e.g. `prepareMessage`, `prepareLicense`, etc.
     * @param nativeId Instance ID.
     * @param method JS prepare callback name.
     * @param waiter ResultWaiter for handling async response.
     * @return The preparation callback function.
     */
    private fun createPrepareCallback(
        nativeId: String,
        method: String,
        waiter: ResultWaiter<String>,
    ): PrepareCallback = {
        val (id, wait) = waiter.make(5000) // 5 second timeout
        
        // Send event to TypeScript using Expo module event system
        sendEvent(
            method,
            bundleOf(
                "nativeId" to nativeId,
                "id" to id,
                "data" to Base64.encodeToString(it, Base64.NO_WRAP),
            ),
        )

        val result = wait() ?: ""
        Base64.decode(result, Base64.NO_WRAP)
    }
}
