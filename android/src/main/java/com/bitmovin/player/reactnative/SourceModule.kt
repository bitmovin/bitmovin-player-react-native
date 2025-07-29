package com.bitmovin.player.reactnative

import com.bitmovin.player.api.analytics.create
import com.bitmovin.player.api.source.Source
import com.bitmovin.player.reactnative.converter.toAnalyticsSourceMetadata
import com.bitmovin.player.reactnative.converter.toJson
import com.bitmovin.player.reactnative.converter.toSourceConfig
import expo.modules.kotlin.exception.CodedException
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class SourceModule : Module() {
    /**
     * In-memory mapping from [NativeId]s to [Source] instances.
     * This must match the Registry pattern from legacy SourceModule
     */
    private val sources: Registry<Source> = mutableMapOf()

    override fun definition() = ModuleDefinition {
        Name("SourceModule")

        OnCreate {
            // Module initialization
        }

        OnDestroy {
            // Clean up sources
            sources.clear()
        }

        AsyncFunction("initializeWithConfig") { nativeId: NativeId, drmNativeId: NativeId?,
            config: Map<String, Any>?, sourceRemoteControlConfig: Map<String, Any>?, ->
            initializeSource(nativeId, drmNativeId, config, sourceRemoteControlConfig, null)
        }

        AsyncFunction("initializeWithAnalyticsConfig") { nativeId: NativeId, drmNativeId: NativeId?,
            config: Map<String, Any>?, sourceRemoteControlConfig: Map<String, Any>?,
            analyticsSourceMetadata: Map<String, Any>?, ->
            initializeSource(nativeId, drmNativeId, config, sourceRemoteControlConfig, analyticsSourceMetadata)
        }

        AsyncFunction("destroy") { nativeId: NativeId ->
            sources.remove(nativeId)
        }

        AsyncFunction("isAttachedToPlayer") { nativeId: NativeId ->
            sources[nativeId]?.isAttachedToPlayer
        }

        AsyncFunction("isActive") { nativeId: NativeId ->
            sources[nativeId]?.isActive
        }

        AsyncFunction("duration") { nativeId: NativeId ->
            sources[nativeId]?.duration
        }

        AsyncFunction("loadingState") { nativeId: NativeId ->
            sources[nativeId]?.loadingState?.name
        }

        AsyncFunction("getMetadata") { nativeId: NativeId ->
            sources[nativeId]?.config?.metadata
        }

        AsyncFunction("setMetadata") { nativeId: NativeId, metadata: Map<String, Any>? ->
            sources[nativeId]?.config?.metadata = metadata?.mapValues { it.value.toString() }
        }

        AsyncFunction("getThumbnail") { nativeId: NativeId, time: Double ->
            sources[nativeId]?.getThumbnail(time)?.toJson()
        }
    }

    private fun initializeSource(
        nativeId: NativeId,
        drmNativeId: NativeId?,
        config: Map<String, Any>?,
        sourceRemoteControlConfig: Map<String, Any>?,
        analyticsSourceMetadata: Map<String, Any>?,
    ) {
        if (sources.containsKey(nativeId)) {
            return // Source already exists
        }

        val sourceConfig = config?.toSourceConfig()
            ?: throw SourceException.InvalidSourceConfig()

        // Get DRM config if provided
        sourceConfig.drmConfig = appContext.registry.getModule<DrmModule>()?.getConfig(drmNativeId)

        val sourceMetadata = analyticsSourceMetadata?.toAnalyticsSourceMetadata()
        try {
            sources[nativeId] = if (sourceMetadata != null) {
                Source.create(sourceConfig, sourceMetadata)
            } else {
                Source.create(sourceConfig)
            }
        } catch (e: Exception) {
            throw SourceException.SourceCreationFailed(e.message ?: "Unknown error")
        }
    }

    // CRITICAL: This method must remain available for cross-module access
    // Called by PlayerModule.loadSource()
    fun getSourceOrNull(nativeId: NativeId): Source? = sources[nativeId]
}

// MARK: - Exception Definitions

sealed class SourceException(message: String) : CodedException(message) {
    class InvalidSourceConfig : SourceException("Invalid source configuration")
    class SourceCreationFailed(reason: String) : SourceException("Could not create source: $reason")
}
