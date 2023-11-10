package com.bitmovin.player.reactnative

import android.util.Log
import com.bitmovin.analytics.api.SourceMetadata
import com.bitmovin.player.api.analytics.create
import com.bitmovin.player.api.source.Source
import com.bitmovin.player.api.source.SourceConfig
import com.bitmovin.player.reactnative.converter.toAnalyticsSourceMetadata
import com.bitmovin.player.reactnative.converter.toJson
import com.bitmovin.player.reactnative.converter.toSourceConfig
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.module.annotations.ReactModule
import com.facebook.react.uimanager.UIManagerModule

private const val MODULE_NAME = "SourceModule"

@ReactModule(name = MODULE_NAME)
class SourceModule(private val context: ReactApplicationContext) : ReactContextBaseJavaModule(context) {
    /**
     * In-memory mapping from `nativeId`s to `Source` instances.
     */
    private val sources: Registry<Source> = mutableMapOf()

    /**
     * JS exported module name.
     */
    override fun getName() = MODULE_NAME

    /**
     * Fetches the [Source] instance associated with [nativeId] from internal sources or throws.
     */
    fun getSource(nativeId: NativeId): Source = sources[nativeId]
        ?: throw IllegalArgumentException("No source matching provided id")

    /**
     * Creates a new `Source` instance inside the internal sources using the provided
     * `config` and `analyticsSourceMetadata` object as well as an initialized DRM configuration ID.
     * @param nativeId ID to be associated with the `Source` instance.
     * @param drmNativeId ID of the DRM config to use.
     * @param config `SourceConfig` object received from JS.
     * @param sourceRemoteControlConfig `SourceRemoteControlConfig` object received from JS. Not supported on Android.
     * @param analyticsSourceMetadata `SourceMetadata` object received from JS.
     */
    @ReactMethod
    fun initWithAnalyticsConfig(
        nativeId: NativeId,
        drmNativeId: NativeId?,
        config: ReadableMap?,
        sourceRemoteControlConfig: ReadableMap?,
        analyticsSourceMetadata: ReadableMap?,
    ) {
        uiManager()?.addUIBlock {
            val sourceMetadata = analyticsSourceMetadata?.toAnalyticsSourceMetadata() ?: SourceMetadata()
            initializeSource(nativeId, drmNativeId, config) { sourceConfig ->
                Source.create(sourceConfig, sourceMetadata)
            }
        }
    }

    /**
     * Creates a new `Source` instance inside the internal sources using the provided
     * `config` object and an initialized DRM configuration ID.
     * @param nativeId ID to be associated with the `Source` instance.
     * @param drmNativeId ID of the DRM config to use.
     * @param config `SourceConfig` object received from JS.
     * @param sourceRemoteControlConfig `SourceRemoteControlConfig` object received from JS. Not supported on Android.
     */
    @ReactMethod
    fun initWithConfig(
        nativeId: NativeId,
        drmNativeId: NativeId?,
        config: ReadableMap?,
        sourceRemoteControlConfig: ReadableMap?,
    ) {
        uiManager()?.addUIBlock {
            initializeSource(nativeId, drmNativeId, config) { sourceConfig ->
                Source.create(sourceConfig)
            }
        }
    }

    private fun initializeSource(
        nativeId: NativeId,
        drmNativeId: NativeId?,
        config: ReadableMap?,
        action: (SourceConfig) -> Source,
    ) {
        val drmConfig = drmNativeId?.let { drmModule()?.getConfig(it) }
        if (!sources.containsKey(nativeId)) {
            val sourceConfig = config?.toSourceConfig()?.apply {
                if (drmConfig != null) {
                    this.drmConfig = drmConfig
                }
            }
            if (sourceConfig == null) {
                Log.d("[SourceModule]", "Could not parse SourceConfig")
            } else {
                sources[nativeId] = action(sourceConfig)
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
     */
    @ReactMethod
    fun setMetadata(nativeId: NativeId, metadata: ReadableMap?) {
        uiManager()?.addUIBlock {
            sources[nativeId]?.config?.metadata = asStringMap(metadata)
        }
    }

    /**
     * Returns the thumbnail image for the `Source` at a certain time.
     * @param nativeId Target player id.
     * @param time Playback time for the thumbnail.
     */
    @ReactMethod
    fun getThumbnail(nativeId: NativeId, time: Double, promise: Promise) {
        uiManager()?.addUIBlock {
            promise.resolve(sources[nativeId]?.getThumbnail(time)?.toJson())
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
    private fun uiManager(): UIManagerModule? = context.getNativeModule(UIManagerModule::class.java)

    /**
     * Helper function that returns the initialized `DrmModule` instance.
     */
    private fun drmModule(): DrmModule? = context.getNativeModule(DrmModule::class.java)
}
