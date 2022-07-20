package com.bitmovin.player.reactnative

import com.bitmovin.player.api.source.Source
import com.bitmovin.player.reactnative.converter.JsonConverter
import com.facebook.react.bridge.*
import com.facebook.react.module.annotations.ReactModule
import com.facebook.react.uimanager.UIManagerModule

@ReactModule(name = SourceModule.name)
class SourceModule(private val context: ReactApplicationContext) : ReactContextBaseJavaModule(context) {
    /**
     * In-memory mapping of `id` <-> `Source`.
     */
    private var registry: MutableMap<String, Source> = mutableMapOf()

    /**
     * Exported module name to JS.
     */
    companion object {
        const val name = "SourceModule"
    }
    override fun getName() = SourceModule.name

    /**
     * Fetch the `Source` instance with id equal to `nativeId` inside this module's `registry`.
     * @param nativeId Target instance to look inside registry.
     */
    fun getSource(nativeId: String?): Source? {
        if (nativeId == null) {
            return null
        }
        return registry[nativeId]
    }

    /**
     * Create a new `Source` instance for the given `config` if none exists already.
     * @param nativeId Source instance nativeId.
     * @param config Source configuration options sent from JS.
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
}
