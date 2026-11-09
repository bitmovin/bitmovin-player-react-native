package com.bitmovin.player.reactnative

import com.bitmovin.player.reactnative.converter.toOfflineDownloadRequest
import com.bitmovin.player.reactnative.converter.toSourceConfig
import com.bitmovin.player.reactnative.converter.toWidevineConfig
import com.bitmovin.player.reactnative.extensions.getMap
import com.bitmovin.player.reactnative.offline.OfflineContentManagerBridge
import expo.modules.kotlin.functions.Queues
import expo.modules.kotlin.jni.JavaScriptFunction
import expo.modules.kotlin.jni.JavaScriptValue
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import java.security.InvalidParameterException

class OfflineModule : Module() {
    private fun create(
        config: Map<String, Any?>?,
        events: SharedOfflineEvents,
        callback: JavaScriptFunction<JavaScriptValue>?,
    ): OfflineContentManagerBridge {
        val identifier = config?.get("identifier") as? String
            ?: throw OfflineException.InvalidIdentifier()
        val sourceConfig = (config["sourceConfig"] as? Map<String, Any?>)?.toSourceConfig()
            ?: throw OfflineException.InvalidSourceConfig()
        val callbacks = CallbackScope(appContext, callback)
        try {
            sourceConfig.drmConfig = config.getMap("sourceConfig")?.getMap("drmConfig")
                ?.toWidevineConfig(callbacks, "sourceConfig.drmConfig")
            val context = appContext.reactContext
                ?: throw InvalidParameterException("ReactApplicationContext is not available")
            return OfflineContentManagerBridge(
                appContext,
                context,
                identifier,
                sourceConfig,
                appContext.cacheDirectory.path,
                events,
                callbacks,
            )
        } catch (error: Exception) {
            callbacks.close()
            throw error
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
