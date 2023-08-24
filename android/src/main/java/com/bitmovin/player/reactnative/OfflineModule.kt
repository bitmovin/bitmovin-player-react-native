package com.bitmovin.player.reactnative

import com.bitmovin.player.api.offline.options.OfflineOptionEntryState
import com.bitmovin.player.reactnative.converter.JsonConverter
import com.bitmovin.player.reactnative.extensions.toList
import com.bitmovin.player.reactnative.offline.OfflineDownloadRequest
import com.bitmovin.player.reactnative.offline.OfflineContentManagerHolder
import com.facebook.react.bridge.*
import com.facebook.react.module.annotations.ReactModule
import com.facebook.react.uimanager.UIManagerModule

private const val OFFLINE_MODULE = "BitmovinOfflineModule"

@ReactModule(name = OFFLINE_MODULE)
class OfflineModule(private val context: ReactApplicationContext) : ReactContextBaseJavaModule(context) {

    /**
     * In-memory mapping from `nativeId`s to `OfflineManager` instances.
     */
    private val offlineContentManagerHolders: Registry<OfflineContentManagerHolder> = mutableMapOf()

    /**
     * JS exported module name.
     */
    override fun getName() = OFFLINE_MODULE

    /**
     * Fetches the `OfflineManager` instance associated with `nativeId` from the internal offline managers.
     * @param nativeId `OfflineManager` instance ID.
     * @return The associated `OfflineManager` instance or `null`.
     */
    fun getOfflineContentManagerHolder(nativeId: NativeId?): OfflineContentManagerHolder? {
        if (nativeId == null) {
            return null
        }
        return offlineContentManagerHolders[nativeId]
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
        uiManager()?.addUIBlock {
            if (!offlineContentManagerHolders.containsKey(nativeId)) {
                val identifier = config?.getString("identifier")
                val sourceConfig = JsonConverter.toSourceConfig(config?.getMap("sourceConfig"))
                drmModule()?.getConfig(drmNativeId)?.let { drmConfig ->
                    sourceConfig?.drmConfig = drmConfig
                }

                if (identifier.isNullOrEmpty() || sourceConfig == null) {
                    promise.reject(java.lang.IllegalArgumentException("Invalid configuration"))
                    return@addUIBlock
                }

                offlineContentManagerHolders[nativeId] = OfflineContentManagerHolder(nativeId, context, identifier, sourceConfig, context.cacheDir.path)
            }
            promise.resolve(null)
        }
    }

    @ReactMethod
    fun getState(nativeId: NativeId, promise: Promise) {
        safeOfflineContentManager(nativeId, promise) {
            promise.resolve(it.state.name)
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
            it.getOptions()
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
            promise.reject(java.lang.IllegalArgumentException("Request may not be null"))
            return
        }

        safeOfflineContentManager(nativeId, promise) {
            try {
                when (it.state) {
                    OfflineOptionEntryState.Downloaded -> {
                        promise.reject(java.lang.IllegalStateException("Download already completed"))
                        return@safeOfflineContentManager
                    }
                    OfflineOptionEntryState.Downloading,
                    OfflineOptionEntryState.Failed -> {
                        promise.reject(java.lang.IllegalStateException("Download already in progress"))
                        return@safeOfflineContentManager
                    }
                    OfflineOptionEntryState.Suspended -> {
                        promise.reject(java.lang.IllegalStateException("Download is suspended"))
                        return@safeOfflineContentManager
                    }
                    else -> {}
                }
                val minimumBitRate = if(request.hasKey("minimumBitrate")) request.getInt("minimumBitrate") else null
                if (minimumBitRate != null && minimumBitRate < 0) {
                    promise.reject(java.lang.IllegalArgumentException("Invalid download request"))
                    return@safeOfflineContentManager
                }

                val audioOptionIds = request.getArray("audioOptionIds")?.toList<String>()?.filterNotNull()
                val textOptionIds = request.getArray("textOptionIds")?.toList<String>()?.filterNotNull()

                getOfflineContentManagerHolder(nativeId)?.process(OfflineDownloadRequest(minimumBitRate, audioOptionIds, textOptionIds))
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
            it.resume()
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
            it.suspend()
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
            it.cancelDownload()
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
            promise.resolve(it.offlineContentManager.usedStorage.toDouble())
        }
    }

    /**
     * Deletes everything related to the related content ID.
     * @param nativeId Target offline manager.
     */
    @ReactMethod
    fun deleteAll(nativeId: NativeId, promise: Promise) {
        safeOfflineContentManager(nativeId, promise) {
            it.deleteAll()
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
            it.downloadLicense()
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
            it.releaseLicense()
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
            it.renewOfflineLicense()
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
            it.release()
            offlineContentManagerHolders.remove(nativeId)
            promise.resolve(null)
        }
    }

    private fun safeOfflineContentManager(nativeId: NativeId, promise: Promise, runBlock: (OfflineContentManagerHolder) -> Unit) {
        getOfflineContentManagerHolder(nativeId)?.let(runBlock)
                ?: promise.reject(java.lang.IllegalArgumentException("Could not find the offline module instance"))
    }

    /**
     * Helper function that returns the initialized `DrmModule` instance.
     */
    private fun drmModule(): DrmModule? =
            context.getNativeModule(DrmModule::class.java)

    /**
     * Helper function that returns the initialized `UIManager` instance.
     */
    private fun uiManager(): UIManagerModule? =
            context.getNativeModule(UIManagerModule::class.java)
}
