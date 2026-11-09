package com.bitmovin.player.reactnative

import com.bitmovin.player.api.offline.options.OfflineOptionEntryState
import com.bitmovin.player.reactnative.converter.toSourceConfig
import com.bitmovin.player.reactnative.offline.OfflineContentManagerBridge
import com.bitmovin.player.reactnative.offline.OfflineDownloadRequest
import expo.modules.kotlin.functions.Queues
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import java.security.InvalidParameterException

class OfflineModule : Module() {
    private fun create(
        config: Map<String, Any?>?,
        drm: SharedDrmConfig?,
        events: SharedOfflineEvents,
    ): OfflineContentManagerBridge {
        val identifier = config?.get("identifier") as? String
            ?: throw OfflineException.InvalidIdentifier()
        val sourceConfig = (config["sourceConfig"] as? Map<String, Any?>)?.toSourceConfig()
            ?: throw OfflineException.InvalidSourceConfig()
        sourceConfig.drmConfig = drm?.config
        val context = appContext.reactContext
            ?: throw InvalidParameterException("ReactApplicationContext is not available")
        return OfflineContentManagerBridge(
            appContext,
            context,
            identifier,
            sourceConfig,
            appContext.cacheDirectory.path,
            events,
        )
    }

    override fun definition() = ModuleDefinition {
        Name("OfflineModule")
        Function("createEvents") { SharedOfflineEvents(appContext) }
        AsyncFunction("create") { config: Map<String, Any?>?, drm: SharedDrmConfig?, events: SharedOfflineEvents ->
            create(config, drm, events)
        }.runOnQueue(Queues.MAIN)
        Class("OfflineEvents", SharedOfflineEvents::class) {
            Constructor { SharedOfflineEvents(appContext) }
            Events("onBitmovinOfflineEvent")
        }
        Class(OfflineContentManagerBridge::class) {
            Constructor { config: Map<String, Any?>?, drm: SharedDrmConfig?, events: SharedOfflineEvents ->
                create(config, drm, events)
            }

            AsyncFunction("getState") { owner: OfflineContentManagerBridge ->
                owner.state.name
            }
            AsyncFunction("getOptions") { owner: OfflineContentManagerBridge ->
                owner.getOptions()
            }
            AsyncFunction("download") { owner: OfflineContentManagerBridge, request: Map<String, Any?> ->

                when (owner.state) {
                    OfflineOptionEntryState.Downloaded -> throw OfflineException.DownloadAlreadyCompleted()
                    OfflineOptionEntryState.Downloading, OfflineOptionEntryState.Failed ->
                        throw OfflineException.DownloadInProgress()
                    OfflineOptionEntryState.Suspended -> throw OfflineException.DownloadSuspended()
                    else -> {}
                }

                // ReactNative translates `number` to `Double` when de/serializing,
                // so we need to manually parse the property to an `Int` here
                val minimumBitRate = (request["minimumBitrate"] as? Number)?.toInt()
                if (minimumBitRate != null && minimumBitRate < 0) {
                    throw OfflineException.InvalidRequest()
                }

                val audioOptionIds = (request["audioOptionIds"] as? List<*>)?.filterIsInstance<String>()
                val textOptionIds = (request["textOptionIds"] as? List<*>)?.filterIsInstance<String>()

                owner.process(OfflineDownloadRequest(minimumBitRate, audioOptionIds, textOptionIds))
            }
            AsyncFunction("resume") { owner: OfflineContentManagerBridge ->
                owner.resume()
            }
            AsyncFunction("suspend") { owner: OfflineContentManagerBridge ->
                owner.suspend()
            }
            AsyncFunction("cancelDownload") { owner: OfflineContentManagerBridge ->
                owner.cancelDownload()
            }
            AsyncFunction("usedStorage") { owner: OfflineContentManagerBridge ->
                owner.offlineContentManager.usedStorage.toDouble()
            }
            AsyncFunction("deleteAll") { owner: OfflineContentManagerBridge ->
                owner.deleteAll()
            }
            AsyncFunction("downloadLicense") { owner: OfflineContentManagerBridge ->
                owner.downloadLicense()
            }
            AsyncFunction("releaseLicense") { owner: OfflineContentManagerBridge ->
                owner.releaseLicense()
            }
            AsyncFunction("renewOfflineLicense") { owner: OfflineContentManagerBridge ->
                owner.renewOfflineLicense()
            }
            AsyncFunction("destroy") { owner: OfflineContentManagerBridge ->
                owner.release()
            }
        }
    }
}
