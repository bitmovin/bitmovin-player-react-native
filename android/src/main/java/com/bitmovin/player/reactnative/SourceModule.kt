package com.bitmovin.player.reactnative

import com.bitmovin.player.api.analytics.create
import com.bitmovin.player.api.source.Source
import com.bitmovin.player.reactnative.converter.toAnalyticsSourceMetadata
import com.bitmovin.player.reactnative.converter.toJson
import com.bitmovin.player.reactnative.converter.toSourceConfig
import com.bitmovin.player.reactnative.extensions.toMap
import com.bitmovin.player.reactnative.extensions.toReadableMap
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.module.annotations.ReactModule
import java.security.InvalidParameterException

private const val MODULE_NAME = "SourceModule"

@ReactModule(name = MODULE_NAME)
class SourceModule(context: ReactApplicationContext) : BitmovinBaseModule(context) {
    /**
     * In-memory mapping from `nativeId`s to `Source` instances.
     */
    private val sources: Registry<Source> = mutableMapOf()

    /**
     * JS exported module name.
     */
    override fun getName() = MODULE_NAME

    /**
     * Fetches the [Source] instance associated with [nativeId] from internal sources or null.
     */
    fun getSourceOrNull(nativeId: NativeId): Source? = sources[nativeId]

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
        analyticsSourceMetadata: ReadableMap,
        promise: Promise,
    ) = initializeSource(nativeId, drmNativeId, config, analyticsSourceMetadata, promise)

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
        promise: Promise,
    ) = initializeSource(nativeId, drmNativeId, config, analyticsSourceMetadata = null, promise)

    private fun initializeSource(
        nativeId: NativeId,
        drmNativeId: NativeId?,
        config: ReadableMap?,
        analyticsSourceMetadata: ReadableMap?,
        promise: Promise,
    ) = promise.unit.resolveOnUiThread {
        val drmConfig = drmNativeId?.let { drmModule.getConfig(it) }
        val sourceConfig = config?.toSourceConfig() ?: throw InvalidParameterException("Invalid SourceConfig")
        val sourceMetadata = analyticsSourceMetadata?.toAnalyticsSourceMetadata()
        if (sources.containsKey(nativeId)) {
            throw IllegalStateException("NativeId $NativeId already exists")
        }
        sourceConfig.drmConfig = drmConfig
        sources[nativeId] = if (sourceMetadata == null) {
            Source.create(sourceConfig)
        } else {
            Source.create(sourceConfig, sourceMetadata)
        }
    }

    /**
     * Removes the `Source` instance associated with `nativeId` from the internal sources.
     * @param nativeId `Source` to be disposed.
     */
    @ReactMethod
    fun destroy(nativeId: NativeId, promise: Promise) {
        promise.unit.resolveOnUiThreadWithSource(nativeId) {
            sources.remove(nativeId)
        }
    }

    /**
     * Whether `nativeId` source is currently attached to a player instance.
     * @param nativeId Source `nativeId`.
     * @param promise: JS promise object.
     */
    @ReactMethod
    fun isAttachedToPlayer(nativeId: NativeId, promise: Promise) {
        promise.bool.resolveOnUiThreadWithSource(nativeId) {
            isAttachedToPlayer
        }
    }

    /**
     * Whether `nativeId` source is currently active in a `Player`.
     * @param nativeId Source `nativeId`.
     * @param promise: JS promise object.
     */
    @ReactMethod
    fun isActive(nativeId: NativeId, promise: Promise) {
        promise.bool.resolveOnUiThreadWithSource(nativeId) {
            isActive
        }
    }

    /**
     * The duration of `nativeId` source in seconds.
     */
    @ReactMethod
    fun duration(nativeId: NativeId, promise: Promise) {
        promise.double.resolveOnUiThreadWithSource(nativeId) {
            duration
        }
    }

    /**
     * The current loading state of `nativeId` source.
     */
    @ReactMethod
    fun loadingState(nativeId: NativeId, promise: Promise) {
        promise.int.resolveOnUiThreadWithSource(nativeId) {
            loadingState.ordinal
        }
    }

    /**
     * Metadata for the currently loaded `nativeId` source.
     */
    @ReactMethod
    fun getMetadata(nativeId: NativeId, promise: Promise) {
        promise.map.nullable.resolveOnUiThreadWithSource(nativeId) {
            config.metadata?.toReadableMap()
        }
    }

    /**
     * Set the metadata for a loaded `nativeId` source.
     */
    @ReactMethod
    fun setMetadata(nativeId: NativeId, metadata: ReadableMap?, promise: Promise) {
        promise.unit.resolveOnUiThreadWithSource(nativeId) {
            config.metadata = metadata?.toMap()
        }
    }

    /**
     * Returns the thumbnail image for the `Source` at a certain time.
     * @param nativeId Target player id.
     * @param time Playback time for the thumbnail.
     */
    @ReactMethod
    fun getThumbnail(nativeId: NativeId, time: Double, promise: Promise) {
        promise.map.nullable.resolveOnUiThreadWithSource(nativeId) {
            getThumbnail(time)?.toJson()
        }
    }

    private inline fun <T> TPromise<T>.resolveOnUiThreadWithSource(
        nativeId: NativeId,
        crossinline block: Source.() -> T,
    ) = resolveOnUiThread { getSource(nativeId, this@SourceModule).block() }
}
