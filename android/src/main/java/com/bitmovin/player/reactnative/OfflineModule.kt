package com.bitmovin.player.reactnative

import com.bitmovin.player.api.offline.options.OfflineOptionEntryState
import com.bitmovin.player.reactnative.converter.toSourceConfig
import com.bitmovin.player.reactnative.extensions.drmModule
import com.bitmovin.player.reactnative.extensions.toStringList
import com.bitmovin.player.reactnative.extensions.uiManagerModule
import com.bitmovin.player.reactnative.offline.OfflineContentManagerBridge
import com.bitmovin.player.reactnative.offline.OfflineDownloadRequest
import com.facebook.react.bridge.*
import com.facebook.react.module.annotations.ReactModule

private const val OFFLINE_MODULE = "BitmovinOfflineModule"

@ReactModule(name = OFFLINE_MODULE)
class OfflineModule(private val context: ReactApplicationContext) : ReactContextBaseJavaModule(context) {

    /**
     * In-memory mapping from `nativeId`s to `OfflineManager` instances.
     */
    private val offlineContentManagerBridges: Registry<OfflineContentManagerBridge> = mutableMapOf()

    /**
     * JS exported module name.
     */
    override fun getName() = OFFLINE_MODULE

    /**
     * Fetches the `OfflineManager` instance associated with `nativeId` from the internal offline managers.
     * @param nativeId `OfflineManager` instance ID.
     * @return The associated `OfflineManager` instance or `null`.
     */
    fun getOfflineContentManagerBridge(nativeId: NativeId?): OfflineContentManagerBridge? {
        if (nativeId == null) {
            return null
        }
        return offlineContentManagerBridges[nativeId]
    }

    /**
     * Callback when a new NativeEventEmitter is created from the Typescript layer.
     */
    @ReactMethod
    fun addListener(eventName: String?) {
        // NO-OP
    }

    /**
     * Callback when a NativeEventEmitter is removed from the Typescript layer.
     */
    @ReactMethod
    fun removeListeners(count: Int?) {
        // NO-OP
    }

    /**
     * Creates a new `OfflineManager` instance inside the internal offline managers using the provided `config` object.
     * @param config `ReadableMap` object received from JS.  Should contain a sourceConfig and location.
     */
    @ReactMethod
    fun initWithConfig(nativeId: NativeId, config: ReadableMap?, drmNativeId: NativeId?, promise: Promise) {
        context.uiManagerModule?.addUIBlock {
            if (!offlineContentManagerBridges.containsKey(nativeId)) {
                val identifier = config?.getString("identifier")
                val sourceConfig = config?.getMap("sourceConfig")?.toSourceConfig()
                sourceConfig?.drmConfig = context.drmModule?.getConfig(drmNativeId)

                if (identifier.isNullOrEmpty() || sourceConfig == null) {
                    promise.reject(IllegalArgumentException("Identifier and SourceConfig may not be null"))
                    return@addUIBlock
                }

                offlineContentManagerBridges[nativeId] = OfflineContentManagerBridge(
                    nativeId,
                    context,
                    identifier,
                    sourceConfig,
                    context.cacheDir.path,
                )
            }
            promise.resolve(null)
        }
    }

    @ReactMethod
    fun getState(nativeId: NativeId, promise: Promise) {
        safeOfflineContentManager(nativeId, promise) {
            promise.resolve(state.name)
        }
    }

    /**
     * Starts the `OfflineContentManager`'s asynchronous process of fetching the `OfflineContentOptions`.
     * When the options are loaded a device event will be fired where the event type is `BitmovinOfflineEvent` and the data has an event type of `onOptionsAvailable`.
     * @param nativeId Target offline manager.
     */
    @ReactMethod
    fun getOptions(nativeId: NativeId, promise: Promise) {
        safeOfflineContentManager(nativeId, promise) {
            getOptions()
            promise.resolve(null)
        }
    }

    /**
     * Enqueues downloads according to the `OfflineDownloadRequest`.
     * The promise will reject in the event of null or invalid request parameters.
     * The promise will reject an `IllegalOperationException` when selecting an `OfflineOptionEntry` to download that is not compatible with the current state.
     * @param nativeId Target offline manager.
     * @param request `ReadableMap` that contains the `OfflineManager.OfflineOptionType`, id, and `OfflineOptionEntryAction` necessary to set the new action.
     */
    @ReactMethod
    fun download(nativeId: NativeId, request: ReadableMap?, promise: Promise) {
        if (request == null) {
            promise.reject(IllegalArgumentException("Request may not be null"))
            return
        }

        safeOfflineContentManager(nativeId, promise) {
            try {
                when (state) {
                    OfflineOptionEntryState.Downloaded -> {
                        promise.reject(IllegalStateException("Download already completed"))
                        return@safeOfflineContentManager
                    }
                    OfflineOptionEntryState.Downloading,
                    OfflineOptionEntryState.Failed,
                    -> {
                        promise.reject(IllegalStateException("Download already in progress"))
                        return@safeOfflineContentManager
                    }
                    OfflineOptionEntryState.Suspended -> {
                        promise.reject(IllegalStateException("Download is suspended"))
                        return@safeOfflineContentManager
                    }
                    else -> {}
                }
                val minimumBitRate = if (request.hasKey("minimumBitrate")) request.getInt("minimumBitrate") else null
                if (minimumBitRate != null && minimumBitRate < 0) {
                    promise.reject(IllegalArgumentException("Invalid download request"))
                    return@safeOfflineContentManager
                }

                val audioOptionIds = request.getArray("audioOptionIds")?.toStringList()?.filterNotNull()
                val textOptionIds = request.getArray("textOptionIds")?.toStringList()?.filterNotNull()

                getOfflineContentManagerBridge(nativeId)?.process(
                    OfflineDownloadRequest(minimumBitRate, audioOptionIds, textOptionIds),
                )
                promise.resolve(null)
            } catch (e: Exception) {
                promise.reject(e)
            }
        }
    }

    /**
     * Resumes all suspended actions.
     * @param nativeId Target offline manager.
     */
    @ReactMethod
    fun resume(nativeId: NativeId, promise: Promise) {
        safeOfflineContentManager(nativeId, promise) {
            resume()
            promise.resolve(null)
        }
    }

    /**
     * Suspends all active actions.
     * @param nativeId Target offline manager.
     */
    @ReactMethod
    fun suspend(nativeId: NativeId, promise: Promise) {
        safeOfflineContentManager(nativeId, promise) {
            suspend()
            promise.resolve(null)
        }
    }

    /**
     * Cancels and deletes the current download.
     * @param nativeId Target offline manager.
     */
    @ReactMethod
    fun cancelDownload(nativeId: NativeId, promise: Promise) {
        safeOfflineContentManager(nativeId, promise) {
            cancelDownload()
            promise.resolve(null)
        }
    }

    /**
     * Resolve `nativeId`'s current `usedStorage`.
     * @param nativeId Target offline manager.
     */
    @ReactMethod
    fun usedStorage(nativeId: NativeId, promise: Promise) {
        safeOfflineContentManager(nativeId, promise) {
            promise.resolve(offlineContentManager.usedStorage.toDouble())
        }
    }

    /**
     * Deletes everything related to the related content ID.
     * @param nativeId Target offline manager.
     */
    @ReactMethod
    fun deleteAll(nativeId: NativeId, promise: Promise) {
        safeOfflineContentManager(nativeId, promise) {
            deleteAll()
            promise.resolve(null)
        }
    }

    /**
     * Downloads the offline license.
     * When finished successfully a device event will be fired where the event type is `BitmovinOfflineEvent` and the data has an event type of `onDrmLicenseUpdated`.
     * Errors are transmitted by a device event will be fired where the event type is `BitmovinOfflineEvent` and the data has an event type of `onError`.
     * @param nativeId Target offline manager.
     */
    @ReactMethod
    fun downloadLicense(nativeId: NativeId, promise: Promise) {
        safeOfflineContentManager(nativeId, promise) {
            downloadLicense()
            promise.resolve(null)
        }
    }

    /**
     * Releases the currently held offline license.
     * When finished successfully a device event will be fired where the event type is `BitmovinOfflineEvent` and the data has an event type of `onDrmLicenseUpdated`.
     * Errors are transmitted by a device event will be fired where the event type is `BitmovinOfflineEvent` and the data has an event type of `onError`.
     * @param nativeId Target offline manager.
     */
    @ReactMethod
    fun releaseLicense(nativeId: NativeId, promise: Promise) {
        safeOfflineContentManager(nativeId, promise) {
            releaseLicense()
            promise.resolve(null)
        }
    }

    /**
     * Renews the already downloaded DRM license.
     * When finished successfully a device event will be fired where the event type is `BitmovinOfflineEvent` and the data has an event type of `onDrmLicenseUpdated`.
     * Errors are transmitted by a device event will be fired where the event type is `BitmovinOfflineEvent` and the data has an event type of `onError`.
     * @param nativeId Target offline manager.
     */
    @ReactMethod
    fun renewOfflineLicense(nativeId: NativeId, promise: Promise) {
        safeOfflineContentManager(nativeId, promise) {
            renewOfflineLicense()
            promise.resolve(null)
        }
    }

    /**
     * Call `.release()` on `nativeId`'s offline manager.
     * IMPORTANT: Call this when the component, in which it was created, is destroyed.
     * The `OfflineManager` should not be used after calling this method.
     * @param nativeId Target player Id.
     */
    @ReactMethod
    fun release(nativeId: NativeId, promise: Promise) {
        safeOfflineContentManager(nativeId, promise) {
            release()
            offlineContentManagerBridges.remove(nativeId)
            promise.resolve(null)
        }
    }

    private fun safeOfflineContentManager(
        nativeId: NativeId,
        promise: Promise,
        runBlock: OfflineContentManagerBridge.() -> Unit,
    ) {
        getOfflineContentManagerBridge(nativeId)?.let(runBlock)
            ?: promise.reject(IllegalArgumentException("Could not find the offline module instance"))
    }
}
