package com.bitmovin.player.reactnative

import com.bitmovin.player.reactnative.converter.toOfflineDownloadRequest
import com.bitmovin.player.reactnative.converter.toSourceConfig
import com.bitmovin.player.reactnative.extensions.getMap
import com.bitmovin.player.reactnative.offline.OfflineContentManagerBridge
import expo.modules.kotlin.exception.CodedException
import expo.modules.kotlin.functions.Queues
import expo.modules.kotlin.jni.JavaScriptFunction
import expo.modules.kotlin.jni.JavaScriptValue
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class OfflineModule : Module() {
    private fun create(
        config: Map<String, Any?>?,
        events: SharedOfflineEvents,
        callback: JavaScriptFunction<JavaScriptValue>?,
    ): OfflineContentManagerBridge {
        val callbacks = CallbackScope(appContext, callback)
        val identifier = config?.get("identifier") as? String
        return OfflineContentManagerBridge(appContext, identifier ?: "", events, callbacks) { listener ->
            if (identifier == null) throw CodedException("ERR_INVALID_ARGUMENT", "Invalid offline identifier", null)
            val sourceConfig = config?.getMap("sourceConfig")?.toSourceConfig(callbacks)
                ?: throw CodedException("ERR_INVALID_ARGUMENT", "Invalid source configuration", null)
            val context = checkNotNull(appContext.reactContext) { "ReactApplicationContext is not available" }
            com.bitmovin.player.api.offline.OfflineContentManager.getOfflineContentManager(
                sourceConfig, appContext.cacheDirectory.path, identifier, listener, context,
            )
        }
    }

    override fun definition() = ModuleDefinition {
        Name("OfflineModule")
        Class("OfflineEvents", SharedOfflineEvents::class) {
            Constructor { SharedOfflineEvents(appContext) }
            Events("onBitmovinOfflineEvent")
        }
        Class("OfflineContentManager", OfflineContentManagerBridge::class) {
            Property("events") { owner: OfflineContentManagerBridge -> owner.events }

            Constructor { config: Map<String, Any?>?, events: SharedOfflineEvents,
                callback: JavaScriptFunction<JavaScriptValue>?, -> create(config, events, callback) }
            AsyncFunction("initialize", OfflineContentManagerBridge::initialize).runOnQueue(Queues.MAIN)

            AsyncFunction("state") { owner: OfflineContentManagerBridge -> owner.state.name }.runOnQueue(Queues.MAIN)
            AsyncFunction("getOptions", OfflineContentManagerBridge::getOptions).runOnQueue(Queues.MAIN)
            AsyncFunction("download") { owner: OfflineContentManagerBridge, request: Map<String, Any?> ->
                owner.process(request.toOfflineDownloadRequest())
            }.runOnQueue(Queues.MAIN)
            AsyncFunction("resume", OfflineContentManagerBridge::resume).runOnQueue(Queues.MAIN)
            AsyncFunction("suspend", OfflineContentManagerBridge::suspend).runOnQueue(Queues.MAIN)
            AsyncFunction("cancelDownload", OfflineContentManagerBridge::cancelDownload).runOnQueue(Queues.MAIN)
            AsyncFunction("usedStorage") { owner: OfflineContentManagerBridge ->
                owner.offlineContentManager.usedStorage.toDouble()
            }.runOnQueue(Queues.MAIN)
            AsyncFunction("deleteAll", OfflineContentManagerBridge::deleteAll).runOnQueue(Queues.MAIN)
            AsyncFunction("downloadLicense", OfflineContentManagerBridge::downloadLicense).runOnQueue(Queues.MAIN)
            AsyncFunction("releaseLicense", OfflineContentManagerBridge::releaseLicense).runOnQueue(Queues.MAIN)
            AsyncFunction("renewOfflineLicense", OfflineContentManagerBridge::renewOfflineLicense).runOnQueue(Queues.MAIN)
            AsyncFunction("destroy", OfflineContentManagerBridge::release).runOnQueue(Queues.MAIN)
        }
    }
}
