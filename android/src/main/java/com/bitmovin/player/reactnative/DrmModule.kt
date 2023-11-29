package com.bitmovin.player.reactnative

import android.util.Base64
import com.bitmovin.player.api.drm.PrepareLicenseCallback
import com.bitmovin.player.api.drm.PrepareMessageCallback
import com.bitmovin.player.api.drm.WidevineConfig
import com.bitmovin.player.reactnative.converter.toWidevineConfig
import com.facebook.react.bridge.*
import com.facebook.react.module.annotations.ReactModule
import java.security.InvalidParameterException
import java.util.concurrent.locks.Condition
import java.util.concurrent.locks.ReentrantLock
import kotlin.concurrent.withLock

/**
 * Represents some operation that transforms data as bytes.
 */
typealias PrepareCallback = (ByteArray) -> ByteArray

private const val MODULE_NAME = "DrmModule"

@ReactModule(name = MODULE_NAME)
class DrmModule(context: ReactApplicationContext) : BitmovinBaseModule(context) {
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
     *  Lock condition used to sync read/write operations on `preparedMessages`.
     */
    private val preparedLicensesCondition = lock.newCondition()

    /**
     * JS exported module name.
     */
    override fun getName() = MODULE_NAME

    /**
     * Fetches the `WidevineConfig` instance associated with `nativeId` from internal drmConfigs.
     * @param nativeId `WidevineConfig` instance ID.
     * @return The associated `WidevineConfig` instance or `null`.
     */
    fun getConfig(nativeId: NativeId?): WidevineConfig? {
        if (nativeId == null) {
            return null
        }
        return drmConfigs[nativeId]
    }

    /**
     * Creates a new `WidevineConfig` instance inside the internal drmConfigs using the provided `config` object.
     * @param nativeId ID to associate with the `WidevineConfig` instance.
     * @param config `DrmConfig` object received from JS.
     */
    @ReactMethod
    fun initWithConfig(nativeId: NativeId, config: ReadableMap, promise: Promise) {
        promise.unit.resolveOnUiThread {
            if (drmConfigs.containsKey(nativeId)) {
                throw InvalidParameterException("NativeId already exists $nativeId")
            }
            val widevineConfig = config.toWidevineConfig() ?: throw InvalidParameterException("Invalid widevine config")
            widevineConfig.prepareMessageCallback = buildPrepareMessageCallback(nativeId, config)
            widevineConfig.prepareLicenseCallback = buildPrepareLicense(nativeId, config)
            drmConfigs[nativeId] = widevineConfig
        }
    }

    /**
     * Removes the `WidevineConfig` instance associated with `nativeId` from the internal drmConfigs.
     * @param nativeId `WidevineConfig` to be disposed.
     */
    @ReactMethod
    fun destroy(nativeId: NativeId) {
        drmConfigs.remove(nativeId)
    }

    /**
     * Function called from JS to store the computed `prepareMessage` return value for `nativeId`.
     */
    @ReactMethod(isBlockingSynchronousMethod = true)
    fun setPreparedMessage(nativeId: NativeId, message: String) {
        lock.withLock {
            preparedMessages[nativeId] = message
            preparedMessagesCondition.signal()
        }
    }

    /**
     * Function called from JS to store the computed `prepareLicense` return value for `nativeId`.
     */
    @ReactMethod(isBlockingSynchronousMethod = true)
    fun setPreparedLicense(nativeId: NativeId, license: String) {
        lock.withLock {
            preparedLicenses[nativeId] = license
            preparedLicensesCondition.signal()
        }
    }

    /**
     * Initialize the `prepareMessage` block in the [widevineConfig]
     * @param widevineConfig Instance ID.
     * @param config `DrmConfig` config object sent from JS.
     */
    private fun buildPrepareMessageCallback(nativeId: NativeId, config: ReadableMap): PrepareMessageCallback? {
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
    private fun buildPrepareLicense(nativeId: NativeId, config: ReadableMap): PrepareLicenseCallback? {
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
        nativeId: NativeId,
        method: String,
        registry: Registry<String>,
        registryCondition: Condition,
    ): PrepareCallback = {
        val args = Arguments.createArray()
        args.pushString(Base64.encodeToString(it, Base64.NO_WRAP))
        context.catalystInstance.callFunction("DRM-$nativeId", method, args as NativeArray)
        lock.withLock {
            registryCondition.await()
            val result = registry[nativeId]
            Base64.decode(result, Base64.NO_WRAP)
        }
    }
}
