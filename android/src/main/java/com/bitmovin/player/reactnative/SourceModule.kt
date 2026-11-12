package com.bitmovin.player.reactnative

import android.os.Handler
import android.os.Looper
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
    private val eventRelay = EventRelay<SourceEvent>(PlayerEventTypes.source) { nativeId, eventName, event ->
        when (event) {
            is SourceEvent.Unloaded -> sendUnloadedEvent(nativeId, eventName, event)
            else -> sendSourceEvent(nativeId, eventName, event.toJson())
        }
    }

    private fun sendSourceEvent(nativeId: NativeId, eventName: String, eventJson: Map<String, Any>) {
        sendEvent(
            "onSourceEvent",
            mapOf(
                "nativeId" to nativeId,
                "eventName" to eventName,
                "event" to NonFiniteSanitizer.sanitizeEventData(eventJson),
            ),
        )
    }

    /**
     * The native `Unloaded` event carries no source. Unlike the player, which emits it for any of its sources,
     * the source emitting it is known here, so it is added to the event.
     */
    private fun sendUnloadedEvent(nativeId: NativeId, eventName: String, event: SourceEvent.Unloaded) {
        val source = SourceRegistry.getSource(nativeId)
        val eventJson = if (source == null) event.toJson() else event.toJson() + ("source" to source.toJson())
        sendSourceEvent(nativeId, eventName, eventJson)
    }

    override fun definition() = ModuleDefinition {
        Name("SourceModule")

        OnCreate {
            // Module initialization
        }

        OnDestroy {
            // `OnDestroy` has no `runOnQueue` and is not guaranteed to run on the main thread, which the event relay
            // requires. Post to the main looper directly: Expo cancels its `mainQueue` right after `OnDestroy`, which
            // would drop a block launched on it.
            Handler(Looper.getMainLooper()).post {
                eventRelay.clear { SourceRegistry.getSource(it) }
                // Only this module's sources, not those of a new module instance, e.g. after a reload.
                SourceRegistry.unregisterAll(owner = this@SourceModule)
            }
        }

        Events("onSourceEvent")

        AsyncFunction("on") { nativeId: NativeId, eventName: String ->
            val source = SourceRegistry.getSource(nativeId) ?: return@AsyncFunction
            eventRelay.on(nativeId, source, eventName)
        }.runOnQueue(Queues.MAIN)

        AsyncFunction("off") { nativeId: NativeId, eventName: String ->
            eventRelay.off(nativeId, SourceRegistry.getSource(nativeId), eventName)
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
            eventRelay.offAll(nativeId, SourceRegistry.getSource(nativeId))
            SourceRegistry.unregister(nativeId)
            // Don't return the removed value: Expo can't convert it to a JS value and rejects the promise.
            Unit
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
            SourceRegistry.register(nativeId, source, owner = this)
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
    class SourceNotInitialized(nativeId: NativeId) : SourceException("Source $nativeId is not initialized")
    class SourceAlreadyAttached(nativeId: NativeId) :
        SourceException("Source $nativeId is already attached to another player")
}
