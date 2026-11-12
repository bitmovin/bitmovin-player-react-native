package com.bitmovin.player.reactnative

import com.bitmovin.player.reactnative.converter.toOfflineDownloadRequest
import com.bitmovin.player.reactnative.converter.toSourceConfig
import com.bitmovin.player.reactnative.extensions.getMap
import com.bitmovin.player.reactnative.offline.SharedOfflineContentManager
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
    ): SharedOfflineContentManager {
        val callbacks = CallbackScope(appContext, callback)
        val identifier = config?.get("identifier") as? String
        return SharedOfflineContentManager(appContext, identifier ?: "", events, callbacks) { listener ->
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
        Class("SharedOfflineEvents", SharedOfflineEvents::class) {
            Constructor { SharedOfflineEvents(appContext) }
            Events("onBitmovinOfflineEvent")
        }
        Class("SharedOfflineContentManager", SharedOfflineContentManager::class) {
            Property("events") { owner: SharedOfflineContentManager -> owner.events }

            Constructor { config: Map<String, Any?>?, events: SharedOfflineEvents,
                callback: JavaScriptFunction<JavaScriptValue>?, -> create(config, events, callback) }

            AsyncFunction("state") { owner: SharedOfflineContentManager -> owner.state.name }.runOnQueue(Queues.MAIN)
            AsyncFunction("getOptions", SharedOfflineContentManager::getOptions).runOnQueue(Queues.MAIN)
            AsyncFunction("download") { owner: SharedOfflineContentManager, request: Map<String, Any?> ->
                owner.process(request.toOfflineDownloadRequest())
            }.runOnQueue(Queues.MAIN)
            AsyncFunction("resume", SharedOfflineContentManager::resume).runOnQueue(Queues.MAIN)
            AsyncFunction("suspend", SharedOfflineContentManager::suspend).runOnQueue(Queues.MAIN)
            AsyncFunction("cancelDownload", SharedOfflineContentManager::cancelDownload).runOnQueue(Queues.MAIN)
            AsyncFunction("usedStorage") { owner: SharedOfflineContentManager ->
                owner.offlineContentManager.usedStorage.toDouble()
            }.runOnQueue(Queues.MAIN)
            AsyncFunction("deleteAll", SharedOfflineContentManager::deleteAll).runOnQueue(Queues.MAIN)
            AsyncFunction("downloadLicense", SharedOfflineContentManager::downloadLicense).runOnQueue(Queues.MAIN)
            AsyncFunction("releaseLicense", SharedOfflineContentManager::releaseLicense).runOnQueue(Queues.MAIN)
            AsyncFunction("renewOfflineLicense", SharedOfflineContentManager::renewOfflineLicense).runOnQueue(Queues.MAIN)
            AsyncFunction("destroy", SharedOfflineContentManager::release).runOnQueue(Queues.MAIN)
        }
    }
}
