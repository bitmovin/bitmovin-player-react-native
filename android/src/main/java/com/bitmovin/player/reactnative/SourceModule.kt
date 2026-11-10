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
import expo.modules.kotlin.jni.JavaScriptFunction
import expo.modules.kotlin.jni.JavaScriptValue
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

        AsyncFunction("getSharedSource") { nativeId: NativeId ->
            checkNotNull(SourceRegistry.getSharedSource(nativeId)) { "Source has not been initialized" }
        }.runOnQueue(Queues.MAIN)

        Class(SharedSource::class) {
            Property("legacyInstanceId") { shared: SharedSource -> shared.legacyInstanceId }

            AsyncFunction("isAttachedToPlayer") { shared: SharedSource ->
                shared.source.isAttachedToPlayer
            }.runOnQueue(Queues.MAIN)

            AsyncFunction("isActive") { shared: SharedSource -> shared.source.isActive }.runOnQueue(Queues.MAIN)

            AsyncFunction("duration") { shared: SharedSource -> shared.source.duration }.runOnQueue(Queues.MAIN)

            AsyncFunction("loadingState") { shared: SharedSource ->
                shared.source.loadingState.toJson()
            }.runOnQueue(Queues.MAIN)

            AsyncFunction("getMetadata") { shared: SharedSource ->
                shared.source.config.metadata
            }.runOnQueue(Queues.MAIN)

            AsyncFunction("setMetadata") { shared: SharedSource, metadata: Map<String, Any>? ->
                shared.source.config.metadata = metadata?.mapValues { it.value.toString() }
            }.runOnQueue(Queues.MAIN)

            AsyncFunction("getThumbnail") { shared: SharedSource, time: Double ->
                shared.source.getThumbnail(time)?.toJson()
            }.runOnQueue(Queues.MAIN)
        }

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

        Events("onSourceEvent", "onSourceReleased")

        AsyncFunction("on") { nativeId: NativeId, eventName: String ->
            val source = SourceRegistry.getSource(nativeId) ?: return@AsyncFunction
            eventRelay.on(nativeId, source, eventName)
        }.runOnQueue(Queues.MAIN)

        AsyncFunction("off") { nativeId: NativeId, eventName: String ->
            eventRelay.off(nativeId, SourceRegistry.getSource(nativeId), eventName)
        }.runOnQueue(Queues.MAIN)

        AsyncFunction("initializeWithConfig") { nativeId: NativeId, config: Map<String, Any>?,
            remote: Map<String, Any>?, callback: JavaScriptFunction<JavaScriptValue>?, ->
            initializeSource(nativeId, config, remote, null, callback)
        }.runOnQueue(Queues.MAIN)

        AsyncFunction("initializeWithAnalyticsConfig") { nativeId: NativeId, config: Map<String, Any>?,
            remote: Map<String, Any>?, analytics: Map<String, Any>?, callback: JavaScriptFunction<JavaScriptValue>?, ->
            initializeSource(nativeId, config, remote, analytics, callback)
        }.runOnQueue(Queues.MAIN)

        AsyncFunction("destroy") { nativeId: NativeId ->
            releaseSource(nativeId)
        }.runOnQueue(Queues.MAIN)
    }

    /**
     * Creates the native [Source] of [nativeId] unless it already exists.
     *
     * @return The canonical shared source, creating it when necessary.
     */
    private fun initializeSource(
        nativeId: NativeId,
        config: Map<String, Any>?,
        sourceRemoteControlConfig: Map<String, Any>?,
        analyticsSourceMetadata: Map<String, Any>?,
        callback: JavaScriptFunction<JavaScriptValue>?,
    ): SharedSource {
        val existingSource = SourceRegistry.getSharedSource(nativeId)
        if (existingSource != null) {
            appContext.registry.getModule<PlayerModule>()?.keepSource(existingSource.source)
            return existingSource
        }

        val callbacks = CallbackScope(appContext, callback)
        return callbacks.createSharedObject {
            val sourceConfig = config?.toSourceConfig(callbacks) ?: throw SourceException.InvalidSourceConfig()
            val sourceMetadata = analyticsSourceMetadata?.toAnalyticsSourceMetadata()
            val source = if (sourceMetadata != null) {
                Source.create(sourceConfig, sourceMetadata)
            } else {
                Source.create(sourceConfig)
            }
            SourceRegistry.register(nativeId, source, owner = this, appContext = appContext, callbacks = callbacks)
            checkNotNull(SourceRegistry.getSharedSource(nativeId))
        }
    }

    /**
     * Releases the bridge's handle of a source: detaches its event listeners and removes it from the
     * [SourceRegistry]. The native [Source] itself is not affected.
     *
     * Emits `onSourceReleased`, so that JS releases its resources of the source as well, e.g. its DRM config.
     */
    fun releaseSource(nativeId: NativeId) {
        eventRelay.offAll(nativeId, SourceRegistry.getSource(nativeId))
        val instanceId = SourceRegistry.unregister(nativeId) ?: return
        sendEvent("onSourceReleased", mapOf("nativeId" to nativeId, "instanceId" to instanceId))
    }
}

// MARK: - Exception Definitions

sealed class SourceException(message: String) : CodedException(message) {
    class InvalidSourceConfig : SourceException("Invalid source configuration")
}
