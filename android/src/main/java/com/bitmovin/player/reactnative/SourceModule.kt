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
    override fun definition() = ModuleDefinition {
        Name("SourceModule")

        OnCreate {
            // Module initialization
        }

        OnDestroy {
            SourceRegistry.clear()
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
            SourceRegistry.unregister(nativeId)
            // Don't return the removed value: Expo can't convert it to a JS value and rejects the promise.
            Unit
        }

        AsyncFunction("isAttachedToPlayer") { nativeId: NativeId ->
            SourceRegistry.getSource(nativeId)?.isAttachedToPlayer
        }

        AsyncFunction("isActive") { nativeId: NativeId ->
            SourceRegistry.getSource(nativeId)?.isActive
        }

        AsyncFunction("duration") { nativeId: NativeId ->
            SourceRegistry.getSource(nativeId)?.duration
        }

        AsyncFunction("loadingState") { nativeId: NativeId ->
            SourceRegistry.getSource(nativeId)?.loadingState?.toJson()
        }

        AsyncFunction("getMetadata") { nativeId: NativeId ->
            SourceRegistry.getSource(nativeId)?.config?.metadata
        }

        AsyncFunction("setMetadata") { nativeId: NativeId, metadata: Map<String, Any>? ->
            SourceRegistry.getSource(nativeId)?.config?.metadata = metadata?.mapValues { it.value.toString() }
        }

        AsyncFunction("getThumbnail") { nativeId: NativeId, time: Double ->
            SourceRegistry.getSource(nativeId)?.getThumbnail(time)?.toJson()
        }
    }

    private fun initializeSource(
        nativeId: NativeId,
        drmNativeId: NativeId?,
        config: Map<String, Any>?,
        sourceRemoteControlConfig: Map<String, Any>?,
        analyticsSourceMetadata: Map<String, Any>?,
    ) {
        if (SourceRegistry.getSource(nativeId) != null) {
            return // Source already exists
        }

        val sourceConfig = config?.toSourceConfig()
            ?: throw SourceException.InvalidSourceConfig()

        // Get DRM config if provided
        sourceConfig.drmConfig = appContext.registry.getModule<DrmModule>()?.getConfig(drmNativeId)

        val sourceMetadata = analyticsSourceMetadata?.toAnalyticsSourceMetadata()
        try {
            val source = if (sourceMetadata != null) {
                Source.create(sourceConfig, sourceMetadata)
            } else {
                Source.create(sourceConfig)
            }
            SourceRegistry.register(nativeId, source)
        } catch (e: Exception) {
            throw SourceException.SourceCreationFailed(e.message ?: "Unknown error")
        }
    }

    // CRITICAL: This method must remain available for cross-module access
    // Called by PlayerModule.loadSource()
    fun getSourceOrNull(nativeId: NativeId): Source? = SourceRegistry.getSource(nativeId)
}

// MARK: - Exception Definitions

sealed class SourceException(message: String) : CodedException(message) {
    class InvalidSourceConfig : SourceException("Invalid source configuration")
    class SourceCreationFailed(reason: String) : SourceException("Could not create source: $reason")
}
