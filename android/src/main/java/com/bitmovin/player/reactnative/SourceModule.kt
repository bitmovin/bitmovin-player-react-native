package com.bitmovin.player.reactnative

import com.bitmovin.player.api.analytics.create
import com.bitmovin.player.api.event.SourceEvent
import com.bitmovin.player.api.source.Source
import com.bitmovin.player.reactnative.converter.toAnalyticsSourceMetadata
import com.bitmovin.player.reactnative.converter.toJson
import com.bitmovin.player.reactnative.converter.toSourceConfig
import com.bitmovin.player.reactnative.util.NonFiniteSanitizer
import expo.modules.kotlin.exception.CodedException
import expo.modules.kotlin.functions.Queues
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class SourceModule : Module() {
    private val eventRelay = EventRelay<SourceEvent>(PlayerEventTypes.source) { nativeId, event ->
        // The native `Unloaded` event carries no source; here the emitting source is known.
        val unloadedSource = if (event is SourceEvent.Unloaded) SourceRegistry.getSource(nativeId) else null
        val eventJson = event.toJson().let { json ->
            if (unloadedSource == null) json else json + ("source" to unloadedSource.toJson())
        }
        sendEvent(
            "onSourceEvent",
            mapOf(
                "nativeId" to nativeId,
                "event" to NonFiniteSanitizer.sanitizeEventData(eventJson),
            ),
        )
    }

    override fun definition() = ModuleDefinition {
        Name("SourceModule")

        OnCreate {
            // Module initialization
        }

        OnDestroy {
            eventRelay.clear()
            SourceRegistry.clear()
        }

        Events("onSourceEvent")

        AsyncFunction("subscribe") { nativeId: NativeId, eventName: String ->
            val source = SourceRegistry.getSource(nativeId) ?: return@AsyncFunction
            eventRelay.subscribe(nativeId, source, eventName)
        }.runOnQueue(Queues.MAIN)

        AsyncFunction("unsubscribe") { nativeId: NativeId, eventName: String ->
            eventRelay.unsubscribe(nativeId, SourceRegistry.getSource(nativeId), eventName)
        }.runOnQueue(Queues.MAIN)

        AsyncFunction("initializeWithConfig") { nativeId: NativeId, drmNativeId: NativeId?,
            config: Map<String, Any>?, sourceRemoteControlConfig: Map<String, Any>?, ->
            initializeSource(nativeId, drmNativeId, config, sourceRemoteControlConfig, null)
        }.runOnQueue(Queues.MAIN)

        AsyncFunction("initializeWithAnalyticsConfig") { nativeId: NativeId, drmNativeId: NativeId?,
            config: Map<String, Any>?, sourceRemoteControlConfig: Map<String, Any>?,
            analyticsSourceMetadata: Map<String, Any>?, ->
            initializeSource(nativeId, drmNativeId, config, sourceRemoteControlConfig, analyticsSourceMetadata)
        }.runOnQueue(Queues.MAIN)

        AsyncFunction("destroy") { nativeId: NativeId ->
            releaseSource(nativeId)
        }.runOnQueue(Queues.MAIN)

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
        val existingSource = SourceRegistry.getSource(nativeId)
        if (existingSource != null) {
            appContext.registry.getModule<PlayerModule>()?.keepSource(existingSource)
            return
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

    /**
     * Releases the bridge's handle of a source: detaches its event listeners and removes it from the
     * [SourceRegistry]. The native [Source] itself is not affected.
     */
    fun releaseSource(nativeId: NativeId) {
        eventRelay.unsubscribeAll(nativeId, SourceRegistry.getSource(nativeId))
        SourceRegistry.unregister(nativeId)
    }
}

// MARK: - Exception Definitions

sealed class SourceException(message: String) : CodedException(message) {
    class InvalidSourceConfig : SourceException("Invalid source configuration")
    class SourceCreationFailed(reason: String) : SourceException("Could not create source: $reason")
}
