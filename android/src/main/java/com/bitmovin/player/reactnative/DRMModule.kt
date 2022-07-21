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

@ReactModule(name = DRMModule.name)
class DRMModule(private val context: ReactApplicationContext) : ReactContextBaseJavaModule(context) {
    /**
     * In-memory mapping of `nativeId` strings and `WidevineConfig` instances.
     */
    private var registry = mutableMapOf<String, WidevineConfig>()

    /**
     * Mapping between an object's `nativeId` and the value that'll be returned by its `prepareMessage` callback.
     */
    private var preparedMessages = mutableMapOf<String, String>()

    /**
     * Mapping between an object's `nativeId` and the value that'll be returned by its `prepareLicense` callback.
     */
    private var preparedLicenses = mutableMapOf<String, String>()

    /**
     * JS exported module name.
     */
    companion object {
        const val name = "DRMModule"
    }
    override fun getName() = DRMModule.name

    /**
     * Fetches the `WidevineConfig` instance associated with `nativeId` from internal registry.
     * @param nativeId `WidevineConfig` instance ID.
     * @return The associated `WidevineConfig` instance or `null`.
     */
    fun getConfig(nativeId: String?): WidevineConfig? {
        if (nativeId == null) {
            return null
        }
        return registry[nativeId]
    }

    /**
     * Creates a new `WidevineConfig` instance inside the internal registry using the provided `config` object.
     * @param nativeId ID to associate with the `WidevineConfig` instance.
     * @param config `DRMConfig` object received from JS.
     */
    @ReactMethod
    fun initWithConfig(nativeId: String, config: ReadableMap?) {
        uiManager()?.addUIBlock {
            if (!registry.containsKey(nativeId) && config != null) {
                JsonConverter.toWidevineConfig(config)?.let {
                    registry[nativeId] = it
                    initPrepareMessage(nativeId, config)
                    initPrepareLicense(nativeId, config)
                }
            }
        }
    }

    /**
     * Removes the `WidevineConfig` instance associated with `nativeId` from the internal registry.
     * @param nativeId `WidevineConfig` to be disposed.
     */
    @ReactMethod
    fun destroy(nativeId: String) {
        registry.remove(nativeId)
    }

    /**
     * Function called from JS to store the computed `prepareMessage` return value for `nativeId`.
     */
    @ReactMethod(isBlockingSynchronousMethod = true)
    fun setPreparedMessage(nativeId: String, message: String) {
        synchronized(preparedMessages) {
            preparedMessages[nativeId] = message
            preparedMessages.notify()
        }
    }

    /**
     * Function called from JS to store the computed `prepareLicense` return value for `nativeId`.
     */
    @ReactMethod(isBlockingSynchronousMethod = true)
    fun setPreparedLicense(nativeId: String, license: String) {
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
    private fun initPrepareMessage(nativeId: String, config: ReadableMap) {
        val widevineConfig = registry[nativeId]
        if (widevineConfig != null && config.hasKey("prepareMessage")) {
            widevineConfig.prepareMessageCallback = PrepareMessageCallback {
                val args = Arguments.createArray()
                args.pushString(Base64.encodeToString(it, Base64.NO_WRAP))
                context.catalystInstance.callFunction(
                    "DRM-${nativeId}",
                    "onPrepareMessage",
                    args as NativeArray
                )
                var preparedMessage: ByteArray
                synchronized(preparedMessages) {
                    preparedMessages.wait()
                    val result = preparedMessages[nativeId]
                    preparedMessage = Base64.decode(result, Base64.NO_WRAP)
                }
                preparedMessage
            }
        }
    }

    /**
     * Initialize the `prepareLicense` block in the `WidevineConfig` associated with `nativeId`.
     * @param nativeId Instance ID.
     * @param config `DRMConfig` config object sent from JS.
     */
    private fun initPrepareLicense(nativeId: String, config: ReadableMap) {
        val widevineConfig = registry[nativeId]
        if (widevineConfig != null && config.hasKey("prepareLicense")) {
            widevineConfig.prepareLicenseCallback = PrepareLicenseCallback {
                val args = Arguments.createArray()
                args.pushString(Base64.encodeToString(it, Base64.NO_WRAP))
                context.catalystInstance.callFunction(
                    "DRM-${nativeId}",
                    "onPrepareLicense",
                    args as NativeArray
                )
                var preparedLicense: ByteArray
                synchronized(preparedLicenses) {
                    preparedLicenses.wait()
                    val result = preparedLicenses[nativeId]
                    preparedLicense = Base64.decode(result, Base64.NO_WRAP)
                }
                preparedLicense
            }
        }
    }

    /**
     * Helper function that returns the initialized `UIManager` instance.
     */
    private fun uiManager(): UIManagerModule? =
        context.getNativeModule(UIManagerModule::class.java)
}
