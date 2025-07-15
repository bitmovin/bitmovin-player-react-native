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
import java.util.concurrent.locks.Condition
import java.util.concurrent.locks.ReentrantLock
import kotlin.concurrent.withLock

/**
 * Represents some operation that transforms data as bytes.
 */
typealias PrepareCallback = (ByteArray) -> ByteArray

private const val MODULE_NAME = "DrmExpoModule"

/**
 * Expo module for DRM configuration management with Widevine DRM support.
 * Handles bidirectional communication for DRM preparation callbacks.
 */
class DrmExpoModule : Module() {
    /**
     * In-memory mapping from `nativeId`s to `WidevineConfig` instances.
     */
    private val drmConfigs: Registry<WidevineConfig> = mutableMapOf()

    /**
     * Module's local lock object used to sync calls between Kotlin and JS.
     */
    private val lock = ReentrantLock()

    /**
     * Mapping between an object's `nativeId` and the value that'll be returned by its `prepareMessage` callback.
     */
    private val preparedMessages: Registry<String> = mutableMapOf()

    /**
     *  Lock condition used to sync read/write operations on `preparedMessages`.
     */
    private val preparedMessagesCondition = lock.newCondition()

    /**
     * Mapping between an object's `nativeId` and the value that'll be returned by its `prepareLicense` callback.
     */
    private val preparedLicenses: Registry<String> = mutableMapOf()

    /**
     *  Lock condition used to sync read/write operations on `preparedLicenses`.
     */
    private val preparedLicensesCondition = lock.newCondition()

    override fun definition() = ModuleDefinition {
        Name(MODULE_NAME)

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

        Function("setPreparedMessage") { nativeId: String, message: String ->
            lock.withLock {
                preparedMessages[nativeId] = message
                preparedMessagesCondition.signal()
            }
        }

        Function("setPreparedLicense") { nativeId: String, license: String ->
            lock.withLock {
                preparedLicenses[nativeId] = license
                preparedLicensesCondition.signal()
            }
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
            preparedMessages,
            preparedMessagesCondition,
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
            preparedLicenses,
            preparedLicensesCondition,
        )
        return PrepareLicenseCallback(prepareLicense)
    }

    /**
     * Creates the body of a preparation callback e.g. `prepareMessage`, `prepareLicense`, etc.
     * @param nativeId Instance ID.
     * @param method JS prepare callback name.
     * @param registry Registry where JS preparation result will be stored.
     * @return The preparation callback function.
     */
    private fun createPrepareCallback(
        nativeId: String,
        method: String,
        registry: Registry<String>,
        registryCondition: Condition,
    ): PrepareCallback = {
        // Send event to TypeScript using Expo module event system
        sendEvent(
            method,
            bundleOf(
                "nativeId" to nativeId,
                "data" to Base64.encodeToString(it, Base64.NO_WRAP),
            ),
        )

        lock.withLock {
            registryCondition.await()
            val result = registry[nativeId]
            Base64.decode(result, Base64.NO_WRAP)
        }
    }
}
