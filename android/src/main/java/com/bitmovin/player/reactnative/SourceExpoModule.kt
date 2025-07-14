package com.bitmovin.player.reactnative

import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import expo.modules.kotlin.exception.CodedException
import com.bitmovin.player.api.source.Source
import com.bitmovin.player.api.source.SourceConfig
import com.bitmovin.player.reactnative.converter.toSourceConfig
import com.bitmovin.player.reactnative.converter.toAnalyticsSourceMetadata

class SourceExpoModule : Module() {
    /**
     * In-memory mapping from [NativeId]s to [Source] instances.
     * This must match the Registry pattern from legacy SourceModule
     */
    private val sources: Registry<Source> = mutableMapOf()

    override fun definition() = ModuleDefinition {
        Name("SourceExpoModule")

        OnCreate {
            // Module initialization
        }

        OnDestroy {
            // Clean up sources
            sources.clear()
        }

        /**
         * Returns the count of active sources for debugging purposes
         */
        Function("getSourceCount") {
            sources.size
        }

        /**
         * Checks if a source with the given nativeId exists
         */
        Function("hasSource") { nativeId: String ->
            sources.containsKey(nativeId)
        }

        /**
         * Creates a new `Source` instance with the provided config.
         */
        AsyncFunction("initializeWithConfig") { nativeId: String, drmNativeId: String?, config: Map<String, Any>?, sourceRemoteControlConfig: Map<String, Any>? ->
            if (sources.containsKey(nativeId)) {
                return@AsyncFunction // Source already exists
            }
            
            val sourceConfig = config?.toSourceConfig()
                ?: throw SourceException.InvalidSourceConfig()
            
            // Get DRM config if provided
            sourceConfig.drmConfig = appContext.registry.getModule<DrmExpoModule>()?.getConfig(drmNativeId)
            
            try {
                val source = Source.create(sourceConfig)
                sources[nativeId] = source
            } catch (e: Exception) {
                throw SourceException.SourceCreationFailed(e.message ?: "Unknown error")
            }
        }

        /**
         * Creates a new `Source` instance with analytics configuration.
         */
        AsyncFunction("initializeWithAnalyticsConfig") { nativeId: String, drmNativeId: String?, config: Map<String, Any>?, sourceRemoteControlConfig: Map<String, Any>?, analyticsSourceMetadata: Map<String, Any>? ->
            if (sources.containsKey(nativeId)) {
                return@AsyncFunction // Source already exists
            }
            
            val sourceConfig = config?.toSourceConfig()
                ?: throw SourceException.InvalidSourceConfig()
            
            // Get DRM config if provided
            sourceConfig.drmConfig = appContext.registry.getModule<DrmExpoModule>()?.getConfig(drmNativeId)
            
            // Add analytics metadata if provided
            analyticsSourceMetadata?.let { metadata ->
                val analyticsMetadata = metadata.toAnalyticsSourceMetadata()
                // TODO: Set analytics metadata on source config when API is available
                // sourceConfig.analyticsSourceMetadata = analyticsMetadata
            }
            
            try {
                val source = Source.create(sourceConfig)
                sources[nativeId] = source
            } catch (e: Exception) {
                throw SourceException.SourceCreationFailed(e.message ?: "Unknown error")
            }
        }

        /**
         * Destroys the source instance with the given native ID.
         */
        AsyncFunction("destroy") { nativeId: String ->
            sources.remove(nativeId)
        }

        /**
         * Checks if the source is attached to a player.
         */
        AsyncFunction("isAttachedToPlayer") { nativeId: String ->
            sources[nativeId]?.isAttachedToPlayer
        }

        /**
         * Checks if the source is currently active.
         */
        AsyncFunction("isActive") { nativeId: String ->
            sources[nativeId]?.isActive
        }

        /**
         * Gets the duration of the source.
         */
        AsyncFunction("duration") { nativeId: String ->
            sources[nativeId]?.duration
        }

        /**
         * Gets the loading state of the source.
         */
        AsyncFunction("loadingState") { nativeId: String ->
            sources[nativeId]?.loadingState?.name
        }
    }

    // CRITICAL: This method must remain available for cross-module access
    // Called by PlayerModule.loadSource()
    fun getSourceOrNull(nativeId: NativeId): Source? = sources[nativeId]
    
    fun getSource(nativeId: NativeId): Source? = sources[nativeId]
}

// MARK: - Exception Definitions

sealed class SourceException(message: String) : CodedException(message) {
    class InvalidSourceConfig : SourceException("Invalid source configuration")
    class SourceCreationFailed(reason: String) : SourceException("Could not create source: $reason")
}