package com.bitmovin.player.reactnative

import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import com.bitmovin.player.api.source.Source

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

        // PHASE 1: Start with simple utility methods

        /**
         * Returns the count of active sources for debugging purposes
         */
        Function("getSourceCount") {
            return sources.size
        }

        /**
         * Checks if a source with the given nativeId exists
         */
        Function("hasSource") { nativeId: String ->
            return sources.containsKey(nativeId)
        }

        // TODO: Add SourceModule methods incrementally
        // Priority: initWithConfig, setSourceConfig methods
    }

    // CRITICAL: This method must remain available for cross-module access
    // Called by PlayerModule.loadSource()
    fun getSourceOrNull(nativeId: NativeId): Source? = sources[nativeId]
}