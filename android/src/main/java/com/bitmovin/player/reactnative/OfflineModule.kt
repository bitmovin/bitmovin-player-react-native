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
        val identifier = config?.get("identifier") as? String
            ?: throw OfflineException.InvalidIdentifier()
        val callbacks = CallbackScope(appContext, callback)
        return callbacks.createSharedObject {
            val sourceConfig = config.getMap("sourceConfig")?.toSourceConfig(callbacks)
                ?: throw OfflineException.InvalidSourceConfig()
            val context = checkNotNull(appContext.reactContext) { "ReactApplicationContext is not available" }
            OfflineContentManagerBridge(
                appContext,
                context,
                identifier,
                sourceConfig,
                appContext.cacheDirectory.path,
                events,
                callbacks,
            )
        }
    }

    override fun definition() = ModuleDefinition {
        Name("OfflineModule")
        Function("createEvents") { SharedOfflineEvents(appContext) }
        AsyncFunction("create") { config: Map<String, Any?>?, events: SharedOfflineEvents,
            callback: JavaScriptFunction<JavaScriptValue>?, ->
            create(config, events, callback)
        }.runOnQueue(Queues.MAIN)
        Class("OfflineEvents", SharedOfflineEvents::class) {
            Constructor { SharedOfflineEvents(appContext) }
            Events("onBitmovinOfflineEvent")
        }
        Class(OfflineContentManagerBridge::class) {
            // Expo requires a constructor even when creation uses the asynchronous factory.
            Constructor { error("Use OfflineModule.create") }

            AsyncFunction("getState") { owner: OfflineContentManagerBridge -> owner.state.name }
            AsyncFunction("getOptions", OfflineContentManagerBridge::getOptions)
            AsyncFunction("download") { owner: OfflineContentManagerBridge, request: Map<String, Any?> ->
                owner.process(request.toOfflineDownloadRequest())
            }
            AsyncFunction("resume", OfflineContentManagerBridge::resume)
            AsyncFunction("suspend", OfflineContentManagerBridge::suspend)
            AsyncFunction("cancelDownload", OfflineContentManagerBridge::cancelDownload)
            AsyncFunction("usedStorage") { owner: OfflineContentManagerBridge ->
                owner.offlineContentManager.usedStorage.toDouble()
            }
            AsyncFunction("deleteAll", OfflineContentManagerBridge::deleteAll)
            AsyncFunction("downloadLicense", OfflineContentManagerBridge::downloadLicense)
            AsyncFunction("releaseLicense", OfflineContentManagerBridge::releaseLicense)
            AsyncFunction("renewOfflineLicense", OfflineContentManagerBridge::renewOfflineLicense)
            AsyncFunction("destroy", OfflineContentManagerBridge::release)
        }
    }
}

sealed class OfflineException(message: String) : CodedException(message) {
    class InvalidIdentifier : OfflineException("Invalid identifier")
    class InvalidSourceConfig : OfflineException("Invalid source config")
}
