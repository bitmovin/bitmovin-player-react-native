package com.bitmovin.player.reactnative

import com.bitmovin.player.api.source.Source
import com.bitmovin.player.reactnative.converter.JsonConverter
import com.facebook.react.bridge.*
import com.facebook.react.module.annotations.ReactModule
import com.facebook.react.uimanager.UIManagerModule

@ReactModule(name = SourceModule.name)
class SourceModule(private val context: ReactApplicationContext) : ReactContextBaseJavaModule(context) {
    /**
     * In-memory mapping from `nativeId`s to `Source` instances.
     */
    private var sources: Registry<Source> = mutableMapOf()

    /**
     * JS exported module name.
     */
    companion object {
        const val name = "SourceModule"
    }
    override fun getName() = SourceModule.name

    /**
     * Fetches the `Source` instance associated with `nativeId` from internal sources.
     * @param nativeId `Source` instance ID.
     * @return The associated `Source` instance or `null`.
     */
    fun getSource(nativeId: NativeId?): Source? {
        if (nativeId == null) {
            return null
        }
        return sources[nativeId]
    }

    /**
     * Creates a new `Source` instance inside the internal sources using the provided `config` object.
     * @param nativeId ID to be associated with the `Source` instance.
     * @param config `SourceConfig` object received from JS.
     */
    @ReactMethod
    fun initWithConfig(nativeId: NativeId, config: ReadableMap?) {
        uiManager()?.addUIBlock {
            if (!sources.containsKey(nativeId)) {
                JsonConverter.toSourceConfig(config)?.let {
                    sources[nativeId] = Source.create(it)
                }
            }
        }
    }

    /**
     * Creates a new `Source` instance inside the internal sources using the provided
     * `config` object and an initialized DRM configuration ID.
     * @param nativeId ID to be associated with the `Source` instance.
     * @param drmNativeId ID of the DRM config to use.
     * @param config `SourceConfig` object received from JS.
     */
    @ReactMethod
    fun initWithDRMConfig(nativeId: NativeId, drmNativeId: NativeId, config: ReadableMap?) {
        uiManager()?.addUIBlock {
            val drmConfig = drmModule()?.getConfig(drmNativeId)
            if (!sources.containsKey(nativeId) && drmConfig != null) {
                JsonConverter.toSourceConfig(config)?.let {
                    it.drmConfig = drmConfig
                    sources[nativeId] = Source.create(it)
                }
            }
        }
    }

    /**
     * Removes the `Source` instance associated with `nativeId` from the internal sources.
     * @param nativeId `Source` to be disposed.
     */
    @ReactMethod
    fun destroy(nativeId: NativeId) {
        sources.remove(nativeId)
    }

    /**
     * Whether `nativeId` source is currently attached to a player instance.
     * @param nativeId Source `nativeId`.
     * @param promise: JS promise object.
     */
    @ReactMethod
    fun isAttachedToPlayer(nativeId: NativeId, promise: Promise) {
        uiManager()?.addUIBlock {
            promise.resolve(sources[nativeId]?.isAttachedToPlayer)
        }
    }

    /**
     * Whether `nativeId` source is currently active in a `Player`.
     * @param nativeId Source `nativeId`.
     * @param promise: JS promise object.
     */
    @ReactMethod
    fun isActive(nativeId: NativeId, promise: Promise) {
        uiManager()?.addUIBlock {
            promise.resolve(sources[nativeId]?.isActive)
        }
    }

    /**
     * The duration of `nativeId` source in seconds.
     * @param nativeId Source `nativeId`.
     * @param promise: JS promise object.
     */
    @ReactMethod
    fun duration(nativeId: NativeId, promise: Promise) {
        uiManager()?.addUIBlock {
            promise.resolve(sources[nativeId]?.duration)
        }
    }

    /**
     * The current loading state of `nativeId` source.
     * @param nativeId Source `nativeId`.
     * @param promise: JS promise object.
     */
    @ReactMethod
    fun loadingState(nativeId: NativeId, promise: Promise) {
        uiManager()?.addUIBlock {
            promise.resolve(sources[nativeId]?.loadingState?.ordinal)
        }
    }

    /**
     * Metadata for the currently loaded `nativeId` source.
     * @param nativeId Source `nativeId`.
     * @param promise: JS promise object.
     */
    @ReactMethod
    fun getMetadata(nativeId: NativeId, promise: Promise) {
        uiManager()?.addUIBlock {
            promise.resolve(sources[nativeId]?.config?.metadata)
        }
    }

    /**
     * Set the metadata for a loaded `nativeId` source.
     * @param nativeId Source `nativeId`.
     * @param promise: JS promise object.
     */
    @ReactMethod
    fun setMetadata(nativeId: NativeId, metadata: ReadableMap?) {
        uiManager()?.addUIBlock {
            sources[nativeId]?.config?.metadata = asStringMap(metadata)
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
