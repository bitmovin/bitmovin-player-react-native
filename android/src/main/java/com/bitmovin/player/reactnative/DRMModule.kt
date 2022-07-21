package com.bitmovin.player.reactnative

import com.bitmovin.player.api.drm.WidevineConfig
import com.bitmovin.player.reactnative.converter.JsonConverter
import com.facebook.react.bridge.*
import com.facebook.react.module.annotations.ReactModule
import com.facebook.react.uimanager.UIManagerModule

@ReactModule(name = DRMModule.name)
class DRMModule(private val context: ReactApplicationContext) : ReactContextBaseJavaModule(context) {
    /**
     * In-memory mapping of `nativeId` strings and `WidevineConfig` instances.
     */
    private var registry: MutableMap<String, WidevineConfig> = mutableMapOf()

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
            if (!registry.containsKey(nativeId)) {
                JsonConverter.toWidevineConfig(config)?.let {
                    registry[nativeId] = it
                }
            }
        }
    }

    /**
     * Removes the `WidevineConfig` instance associated with `nativeId` from the internal registry.
     * @param nativeId `WidevineConfig` to be disposed.
     */
    fun destroy(nativeId: String) {
        registry.remove(nativeId)
    }

    /**
     * Helper function that returns the initialized `UIManager` instance.
     */
    private fun uiManager(): UIManagerModule? =
        context.getNativeModule(UIManagerModule::class.java)
}
