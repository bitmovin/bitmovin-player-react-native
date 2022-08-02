package com.bitmovin.player.reactnative

import android.util.Base64
import com.bitmovin.player.api.drm.PrepareLicenseCallback
import com.bitmovin.player.api.drm.PrepareMessageCallback
import com.bitmovin.player.api.drm.WidevineConfig
import com.bitmovin.player.reactnative.converter.JsonConverter
import com.facebook.react.bridge.*
import com.facebook.react.module.annotations.ReactModule
import com.facebook.react.uimanager.UIManagerModule
import okhttp3.internal.notify
import okhttp3.internal.wait

/**
 * Represents some operation that transforms data as bytes.
 */
typealias PrepareCallback = (ByteArray) -> ByteArray

@ReactModule(name = DrmModule.name)
class DrmModule(private val context: ReactApplicationContext) : ReactContextBaseJavaModule(context) {
    /**
     * In-memory mapping from `nativeId`s to `WidevineConfig` instances.
     */
    private val drmConfigs: Registry<WidevineConfig> = mutableMapOf()

    /**
     * Mapping between an object's `nativeId` and the value that'll be returned by its `prepareMessage` callback.
     */
    private val preparedMessages: Registry<String> = mutableMapOf()

    /**
     * Mapping between an object's `nativeId` and the value that'll be returned by its `prepareLicense` callback.
     */
    private val preparedLicenses: Registry<String> = mutableMapOf()

    /**
     * JS exported module name.
     */
    companion object {
        const val name = "DrmModule"
    }
    override fun getName() = DrmModule.name

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
     * @param config `DRMConfig` object received from JS.
     */
    @ReactMethod
    fun initWithConfig(nativeId: NativeId, config: ReadableMap?) {
        uiManager()?.addUIBlock {
            if (!drmConfigs.containsKey(nativeId) && config != null) {
                JsonConverter.toWidevineConfig(config)?.let {
                    drmConfigs[nativeId] = it
                    initPrepareMessage(nativeId, config)
                    initPrepareLicense(nativeId, config)
                }
            }
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
        synchronized(preparedMessages) {
            preparedMessages[nativeId] = message
            preparedMessages.notify()
        }
    }

    /**
     * Function called from JS to store the computed `prepareLicense` return value for `nativeId`.
     */
    @ReactMethod(isBlockingSynchronousMethod = true)
    fun setPreparedLicense(nativeId: NativeId, license: String) {
        synchronized(preparedLicenses) {
            preparedLicenses[nativeId] = license
            preparedLicenses.notify()
        }
    }

    /**
     * Initialize the `prepareMessage` block in the `WidevineConfig` associated with `nativeId`.
     * @param nativeId Instance ID.
     * @param config `DRMConfig` config object sent from JS.
     */
    private fun initPrepareMessage(nativeId: NativeId, config: ReadableMap) {
        val widevineConfig = drmConfigs[nativeId]
        val widevineJson = config.getMap("widevine")
        if (widevineConfig != null && widevineJson != null && widevineJson.hasKey("prepareMessage")) {
            val prepareMessage = createPrepareCallback(nativeId, "onPrepareMessage", preparedMessages)
            widevineConfig.prepareMessageCallback = PrepareMessageCallback {
                prepareMessage(it)
            }
        }
    }

    /**
     * Initialize the `prepareLicense` block in the `WidevineConfig` associated with `nativeId`.
     * @param nativeId Instance ID.
     * @param config `DRMConfig` config object sent from JS.
     */
    private fun initPrepareLicense(nativeId: NativeId, config: ReadableMap) {
        val widevineConfig = drmConfigs[nativeId]
        val widevineJson = config.getMap("widevine")
        if (widevineConfig != null && widevineJson != null && widevineJson.hasKey("prepareLicense")) {
            val prepareLicense = createPrepareCallback(nativeId, "onPrepareLicense", preparedLicenses)
            widevineConfig.prepareLicenseCallback = PrepareLicenseCallback {
                prepareLicense(it)
            }
        }
    }

    /**
     * Creates the body of a preparation callback e.g. `prepareMessage`, `prepareLicense`, etc.
     * @param nativeId Instance ID.
     * @param method JS prepare callback name.
     * @param registry Registry where JS preparation result will be stored.
     * @return The preparation callback function.
     */
    private fun createPrepareCallback(nativeId: NativeId, method: String, registry: Registry<String>): PrepareCallback = {
        val args = Arguments.createArray()
        args.pushString(Base64.encodeToString(it, Base64.NO_WRAP))
        context.catalystInstance.callFunction("DRM-${nativeId}", method, args as NativeArray)
        var preparedData: ByteArray
        synchronized(registry) {
            registry.wait()
            val result = registry[nativeId]
            preparedData = Base64.decode(result, Base64.NO_WRAP)
        }
        preparedData
    }

    /**
     * Helper function that returns the initialized `UIManager` instance.
     */
    private fun uiManager(): UIManagerModule? =
        context.getNativeModule(UIManagerModule::class.java)
}
