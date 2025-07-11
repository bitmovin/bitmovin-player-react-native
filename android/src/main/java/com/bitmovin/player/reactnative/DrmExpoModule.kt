package com.bitmovin.player.reactnative

import android.util.Base64
import androidx.core.os.bundleOf
import com.bitmovin.player.api.drm.PrepareLicenseCallback
import com.bitmovin.player.api.drm.PrepareMessageCallback
import com.bitmovin.player.api.drm.WidevineConfig
import com.bitmovin.player.reactnative.converter.toWidevineConfig
import com.facebook.react.bridge.*
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import expo.modules.kotlin.Promise
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
                val readableMap = convertMapToReadableMap(config)
                val widevineConfig = readableMap.toWidevineConfig() ?: throw InvalidParameterException("Invalid widevine config")
                widevineConfig.prepareMessageCallback = buildPrepareMessageCallback(nativeId, readableMap)
                widevineConfig.prepareLicenseCallback = buildPrepareLicense(nativeId, readableMap)
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
        AsyncFunction("setPreparedCertificate") { _: String, _: String -> 
            // No-op on Android
        }
        AsyncFunction("setPreparedSyncMessage") { _: String, _: String -> 
            // No-op on Android
        }
        AsyncFunction("setPreparedLicenseServerUrl") { _: String, _: String -> 
            // No-op on Android
        }
        AsyncFunction("setPreparedContentId") { _: String, _: String -> 
            // No-op on Android
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
    private fun buildPrepareMessageCallback(nativeId: String, config: ReadableMap): PrepareMessageCallback? {
        if (config.getMap("widevine")?.hasKey("prepareMessage") != true) {
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
    private fun buildPrepareLicense(nativeId: String, config: ReadableMap): PrepareLicenseCallback? {
        if (config.getMap("widevine")?.hasKey("prepareLicense") != true) {
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
        sendEvent(method, bundleOf(
            "nativeId" to nativeId,
            "data" to Base64.encodeToString(it, Base64.NO_WRAP)
        ))
        
        lock.withLock {
            registryCondition.await()
            val result = registry[nativeId]
            Base64.decode(result, Base64.NO_WRAP)
        }
    }

    /**
     * Converts a Map<String, Any?> to ReadableMap for compatibility with legacy converter methods.
     */
    private fun convertMapToReadableMap(map: Map<String, Any?>): ReadableMap {
        val writableMap = Arguments.createMap()
        map.forEach { (key, value) ->
            when (value) {
                is String -> writableMap.putString(key, value)
                is Int -> writableMap.putInt(key, value)
                is Double -> writableMap.putDouble(key, value)
                is Boolean -> writableMap.putBoolean(key, value)
                is Map<*, *> -> writableMap.putMap(key, convertMapToReadableMap(value as Map<String, Any?>))
                is List<*> -> {
                    val array = Arguments.createArray()
                    value.forEach { item ->
                        when (item) {
                            is String -> array.pushString(item)
                            is Int -> array.pushInt(item)
                            is Double -> array.pushDouble(item)
                            is Boolean -> array.pushBoolean(item)
                            is Map<*, *> -> array.pushMap(convertMapToReadableMap(item as Map<String, Any?>))
                        }
                    }
                    writableMap.putArray(key, array)
                }
                null -> writableMap.putNull(key)
            }
        }
        return writableMap
    }

    companion object {
        /**
         * Static access method to maintain compatibility with other modules.
         * Retrieves the WidevineConfig for the given nativeId.
         */
        @JvmStatic
        fun getDrmConfig(nativeId: String): WidevineConfig? {
            // TODO: Implement global registry pattern if needed by other modules
            return null
        }
    }
}