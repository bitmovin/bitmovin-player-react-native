package com.bitmovin.player.reactnative

import com.bitmovin.player.api.drm.WidevineConfig
import com.bitmovin.player.reactnative.converter.JsonConverter
import com.facebook.react.bridge.*
import com.facebook.react.module.annotations.ReactModule
import com.facebook.react.uimanager.UIManagerModule

@ReactModule(name = DRMModule.name)
class DRMModule(private val context: ReactApplicationContext) : ReactContextBaseJavaModule(context) {
    /**
     * In-memory mapping of `id` <-> `WidevineConfig`.
     */
    private var registry: MutableMap<String, WidevineConfig> = mutableMapOf()

    /**
     * Exported module name to JS.
     */
    companion object {
        const val name = "DRMModule"
    }
    override fun getName() = DRMModule.name

    /**
     * Fetch the `WidevineConfig` instance with id equal to `nativeId` inside this module's `registry`.
     * @param nativeId Target instance to look inside registry.
     */
    fun getConfig(nativeId: String?): WidevineConfig? {
        if (nativeId == null) {
            return null
        }
        return registry[nativeId]
    }

    /**
     * Create a new `Widevine` instance for the given `config` if none exists already.
     * @param nativeId DRM instance nativeId.
     * @param config DRM configuration options sent from JS.
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
     * Helper function that returns the initialized `UIManager` instance.
     */
    private fun uiManager(): UIManagerModule? =
        context.getNativeModule(UIManagerModule::class.java)
}
