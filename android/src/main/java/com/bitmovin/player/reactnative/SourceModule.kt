package com.bitmovin.player.reactnative

import com.bitmovin.player.api.source.Source
import com.bitmovin.player.reactnative.converter.JsonConverter
import com.facebook.react.bridge.*
import com.facebook.react.module.annotations.ReactModule
import com.facebook.react.uimanager.UIManagerModule

@ReactModule(name = SourceModule.name)
class SourceModule(private val context: ReactApplicationContext) : ReactContextBaseJavaModule(context) {
    /**
     * In-memory mapping of `nativeId` strings and `Source` instances.
     */
    private var registry: MutableMap<String, Source> = mutableMapOf()

    /**
     * JS exported module name.
     */
    companion object {
        const val name = "SourceModule"
    }
    override fun getName() = SourceModule.name

    /**
     * Fetches the `Source` instance associated with `nativeId` from internal registry.
     * @param nativeId `Source` instance ID.
     * @return The associated `Source` instance or `null`.
     */
    fun getSource(nativeId: String?): Source? {
        if (nativeId == null) {
            return null
        }
        return registry[nativeId]
    }

    /**
     * Creates a new `Source` instance inside the internal registry using the provided `config` object.
     * @param nativeId ID to be associated with the `Source` instance.
     * @param config `SourceConfig` object received from JS.
     */
    @ReactMethod
    fun initWithConfig(nativeId: String, config: ReadableMap?) {
        uiManager()?.addUIBlock {
            if (!registry.containsKey(nativeId)) {
                JsonConverter.toSourceConfig(config)?.let {
                    registry[nativeId] = Source.create(it)
                }
            }
        }
    }

    /**
     * Creates a new `Source` instance inside the internal registry using the provided
     * `config` object and an initialized DRM configuration ID.
     * @param nativeId ID to be associated with the `Source` instance.
     * @param drmNativeId ID of the DRM config to use.
     * @param config `SourceConfig` object received from JS.
     */
    @ReactMethod
    fun initWithDRMConfig(nativeId: String, drmNativeId: String, config: ReadableMap?) {
        uiManager()?.addUIBlock {
            val drmConfig = drmModule()?.getConfig(drmNativeId)
            if (!registry.containsKey(nativeId) && drmConfig != null) {
                JsonConverter.toSourceConfig(config)?.let {
                    it.drmConfig = drmConfig
                    registry[nativeId] = Source.create(it)
                }
            }
        }
    }

    /**
     * Removes the `Source` instance associated with `nativeId` from the internal registry.
     * @param nativeId `Source` to be disposed.
     */
    @ReactMethod
    fun destroy(nativeId: String) {
        registry.remove(nativeId)
    }

    /**
     * Whether `nativeId` source is currently attached to a player instance.
     * @param nativeId Source `nativeId`.
     * @param promise: JS promise object.
     */
    @ReactMethod
    fun isAttachedToPlayer(nativeId: String, promise: Promise) {
        uiManager()?.addUIBlock {
            promise.resolve(registry[nativeId]?.isAttachedToPlayer)
        }
    }

    /**
     * Whether `nativeId` source is currently active in a `Player`.
     * @param nativeId Source `nativeId`.
     * @param promise: JS promise object.
     */
    @ReactMethod
    fun isActive(nativeId: String, promise: Promise) {
        uiManager()?.addUIBlock {
            promise.resolve(registry[nativeId]?.isActive)
        }
    }

    /**
     * The duration of `nativeId` source in seconds.
     * @param nativeId Source `nativeId`.
     * @param promise: JS promise object.
     */
    @ReactMethod
    fun duration(nativeId: String, promise: Promise) {
        uiManager()?.addUIBlock {
            promise.resolve(registry[nativeId]?.duration)
        }
    }

    /**
     * The current loading state of `nativeId` source.
     * @param nativeId Source `nativeId`.
     * @param promise: JS promise object.
     */
    @ReactMethod
    fun loadingState(nativeId: String, promise: Promise) {
        uiManager()?.addUIBlock {
            promise.resolve(registry[nativeId]?.loadingState?.ordinal)
        }
    }

    /**
     * Metadata for the currently loaded `nativeId` source.
     * @param nativeId Source `nativeId`.
     * @param promise: JS promise object.
     */
    @ReactMethod
    fun getMetadata(nativeId: String, promise: Promise) {
        uiManager()?.addUIBlock {
            promise.resolve(registry[nativeId]?.config?.metadata)
        }
    }

    /**
     * Set the metadata for a loaded `nativeId` source.
     * @param nativeId Source `nativeId`.
     * @param promise: JS promise object.
     */
    @ReactMethod
    fun setMetadata(nativeId: String, metadata: ReadableMap?) {
        uiManager()?.addUIBlock {
            registry[nativeId]?.config?.metadata = asStringMap(metadata)
        }
    }

    /**
     * Helper method that converts a React `ReadableMap` into a kotlin String -> String map.
     */
    private fun asStringMap(readableMap: ReadableMap?): Map<String, String>? {
        if (readableMap == null) {
            return null
        }
        val map = mutableMapOf<String, String>()
        for (entry in readableMap.entryIterator) {
            map[entry.key] = entry.value.toString()
        }
        return map
    }

    /**
     * Helper function that returns the initialized `UIManager` instance.
     */
    private fun uiManager(): UIManagerModule? =
        context.getNativeModule(UIManagerModule::class.java)

    /**
     * Helper function that returns the initialized `DrmModule` instance.
     */
    private fun drmModule(): DrmModule? =
        context.getNativeModule(DrmModule::class.java)
}
