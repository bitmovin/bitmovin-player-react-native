package com.bitmovin.player.reactnative

import com.bitmovin.player.api.offline.options.OfflineOptionEntryState
import com.bitmovin.player.reactnative.converter.toSourceConfig
import com.bitmovin.player.reactnative.offline.OfflineContentManagerBridge
import com.bitmovin.player.reactnative.offline.OfflineDownloadRequest
import expo.modules.kotlin.exception.CodedException
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import java.security.InvalidParameterException

class OfflineModule : Module() {

    /**
     * In-memory mapping from `nativeId`s to `OfflineContentManagerBridge` instances.
     * This must match the Registry pattern from legacy OfflineModule
     */
    private val offlineContentManagerBridges: Registry<OfflineContentManagerBridge> = mutableMapOf()

    override fun definition() = ModuleDefinition {
        Name("OfflineModule")

        Events("onBitmovinOfflineEvent")

        OnCreate {
            // Module initialization
        }

        OnDestroy {
            // Clean up offline content managers
            offlineContentManagerBridges.clear()
        }

        AsyncFunction("initializeWithConfig") { nativeId: NativeId, config: Map<String, Any?>?, drmNativeId: NativeId? ->
            if (offlineContentManagerBridges.containsKey(nativeId)) {
                throw OfflineException.ManagerAlreadyExists(nativeId)
            }

            val identifier = config?.get("identifier") as? String
                ?: throw OfflineException.InvalidIdentifier()

            val sourceConfig = (config["sourceConfig"] as? Map<String, Any?>)?.toSourceConfig()
                ?: throw OfflineException.InvalidSourceConfig()

            // Get DRM config from DrmModule if available
            sourceConfig.drmConfig = appContext.registry.getModule<DrmModule>()?.getConfig(drmNativeId)

            val context = appContext.reactContext
                ?: throw InvalidParameterException("ReactApplicationContext is not available")

            offlineContentManagerBridges[nativeId] = OfflineContentManagerBridge(
                nativeId,
                context,
                this@OfflineModule,
                identifier,
                sourceConfig,
                appContext.cacheDirectory.path,
            )
        }

        /**
         * Gets the current state of the `OfflineContentManager`
         */
        AsyncFunction("getState") { nativeId: NativeId ->
            getOfflineContentManagerBridge(nativeId).state.name
        }

        /**
         * Starts the `OfflineContentManager`'s asynchronous process of fetching the `OfflineContentOptions`.
         * When the options are loaded a device event will be fired where the event type is `BitmovinOfflineEvent` * and the data has an event type of `onOptionsAvailable`.
         */
        AsyncFunction("getOptions") { nativeId: NativeId ->
            getOfflineContentManagerBridge(nativeId).getOptions()
        }

        /**
         * Enqueues downloads according to the `OfflineDownloadRequest`.
         * The promise will reject in the event of null or invalid request parameters.
         */
        AsyncFunction("download") { nativeId: NativeId, request: Map<String, Any?> ->
            val bridge = getOfflineContentManagerBridge(nativeId)

            when (bridge.state) {
                OfflineOptionEntryState.Downloaded -> throw OfflineException.DownloadAlreadyCompleted()
                OfflineOptionEntryState.Downloading, OfflineOptionEntryState.Failed ->
                    throw OfflineException.DownloadInProgress()
                OfflineOptionEntryState.Suspended -> throw OfflineException.DownloadSuspended()
                else -> {}
            }

            val minimumBitRate = request["minimumBitrate"] as? Int
            if (minimumBitRate != null && minimumBitRate < 0) {
                throw OfflineException.InvalidRequest()
            }

            val audioOptionIds = (request["audioOptionIds"] as? List<*>)?.filterIsInstance<String>()
            val textOptionIds = (request["textOptionIds"] as? List<*>)?.filterIsInstance<String>()

            bridge.process(OfflineDownloadRequest(minimumBitRate, audioOptionIds, textOptionIds))
        }

        /**
         * Resumes all suspended actions.
         */
        AsyncFunction("resume") { nativeId: NativeId ->
            getOfflineContentManagerBridge(nativeId).resume()
        }

        /**
         * Suspends all active actions.
         */
        AsyncFunction("suspend") { nativeId: NativeId ->
            getOfflineContentManagerBridge(nativeId).suspend()
        }

        /**
         * Cancels and deletes the current download.
         */
        AsyncFunction("cancelDownload") { nativeId: NativeId ->
            getOfflineContentManagerBridge(nativeId).cancelDownload()
        }

        /**
         * Resolve `nativeId`'s current `usedStorage`.
         */
        AsyncFunction("usedStorage") { nativeId: NativeId ->
            getOfflineContentManagerBridge(nativeId).offlineContentManager.usedStorage.toDouble()
        }

        /**
         * Deletes everything related to the related content ID.
         */
        AsyncFunction("deleteAll") { nativeId: NativeId ->
            getOfflineContentManagerBridge(nativeId).deleteAll()
        }

        /**
         * Downloads the offline license.
         * When finished successfully a device event will be fired where the event type is `BitmovinOfflineEvent` * and the data has an event type of `onDrmLicenseUpdated`.
         */
        AsyncFunction("downloadLicense") { nativeId: NativeId ->
            getOfflineContentManagerBridge(nativeId).downloadLicense()
        }

        /**
         * Releases the currently held offline license.
         * When finished successfully a device event will be fired where the event type is `BitmovinOfflineEvent` * and the data has an event type of `onDrmLicenseUpdated`.
         */
        AsyncFunction("releaseLicense") { nativeId: NativeId ->
            getOfflineContentManagerBridge(nativeId).releaseLicense()
        }

        /**
         * Renews the already downloaded DRM license.
         * When finished successfully a device event will be fired where the event type is `BitmovinOfflineEvent` * and the data has an event type of `onDrmLicenseUpdated`.
         */
        AsyncFunction("renewOfflineLicense") { nativeId: NativeId ->
            getOfflineContentManagerBridge(nativeId).renewOfflineLicense()
        }

        /**
         * Call `.release()` on `nativeId`'s offline manager.
         * IMPORTANT: Call this when the component, in which it was created, is destroyed.
         * The `OfflineManager` should not be used after calling this method.
         */
        AsyncFunction("release") { nativeId: NativeId ->
            val bridge = getOfflineContentManagerBridge(nativeId)
            bridge.release()
            offlineContentManagerBridges.remove(nativeId)
        }
    }

    /**
     * Helper function to get OfflineContentManagerBridge with proper error handling
     */
    fun getOfflineContentManagerBridge(nativeId: NativeId): OfflineContentManagerBridge {
        return offlineContentManagerBridges[nativeId] ?: throw OfflineException.ManagerNotFound(nativeId)
    }
}

// MARK: - Exception Definitions

sealed class OfflineException(message: String) : CodedException(message) {
    class ManagerAlreadyExists(nativeId: NativeId) : OfflineException(
        "Content manager bridge id already exists: $nativeId",
    )
    class ManagerNotFound(nativeId: NativeId) : OfflineException("No offline content manager bridge for id $nativeId")
    class InvalidIdentifier : OfflineException("Invalid identifier")
    class InvalidSourceConfig : OfflineException("Invalid source config")
    class InvalidRequest : OfflineException("Invalid download request")
    class DownloadAlreadyCompleted : OfflineException("Download already completed")
    class DownloadInProgress : OfflineException("Download already in progress")
    class DownloadSuspended : OfflineException("Download is suspended")
}
