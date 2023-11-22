package com.bitmovin.player.reactnative

import com.bitmovin.player.api.offline.options.OfflineOptionEntryState
import com.bitmovin.player.reactnative.converter.toSourceConfig
import com.bitmovin.player.reactnative.extensions.drmModule
import com.bitmovin.player.reactnative.extensions.getIntOrNull
import com.bitmovin.player.reactnative.extensions.getStringArray
import com.bitmovin.player.reactnative.offline.OfflineContentManagerBridge
import com.bitmovin.player.reactnative.offline.OfflineDownloadRequest
import com.facebook.react.bridge.*
import com.facebook.react.module.annotations.ReactModule
import java.security.InvalidParameterException

private const val OFFLINE_MODULE = "BitmovinOfflineModule"

@ReactModule(name = OFFLINE_MODULE)
class OfflineModule(context: ReactApplicationContext) : BitmovinBaseModule(context) {

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
     */
    fun getOfflineContentManagerBridgeOrNull(
        nativeId: NativeId,
    ): OfflineContentManagerBridge? = offlineContentManagerBridges[nativeId]

    private fun RejectPromiseOnExceptionBlock.getOfflineContentManagerBridge(
        nativeId: NativeId,
    ): OfflineContentManagerBridge = offlineContentManagerBridges[nativeId]
        ?: throw IllegalArgumentException("No offline content manager bridge for id $nativeId")

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
        promise.resolveOnUIThread {
            if (offlineContentManagerBridges.containsKey(nativeId)) {
                throw InvalidParameterException("content manager bridge id already exists: $nativeId")
            }
            val identifier = config?.getString("identifier")
                ?.takeIf { it.isNotEmpty() } ?: throw IllegalArgumentException("invalid identifier")

            val sourceConfig = config.getMap("sourceConfig")?.toSourceConfig()
                ?: throw IllegalArgumentException("Invalid source config")

            sourceConfig.drmConfig = context.drmModule?.getConfig(drmNativeId)

            offlineContentManagerBridges[nativeId] = OfflineContentManagerBridge(
                nativeId,
                context,
                identifier,
                sourceConfig,
                context.cacheDir.path,
            )
        }
    }

    @ReactMethod
    fun getState(nativeId: NativeId, promise: Promise) {
        promise.resolveWithBridge(nativeId) {
            state.name
        }
    }

    /**
     * Starts the `OfflineContentManager`'s asynchronous process of fetching the `OfflineContentOptions`.
     * When the options are loaded a device event will be fired where the event type is `BitmovinOfflineEvent` and the data has an event type of `onOptionsAvailable`.
     * @param nativeId Target offline manager.
     */
    @ReactMethod
    fun getOptions(nativeId: NativeId, promise: Promise) {
        promise.resolveWithBridge(nativeId) {
            getOptions()
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
    fun download(nativeId: NativeId, request: ReadableMap, promise: Promise) {
        promise.resolveWithBridge(nativeId) {
            when (state) {
                OfflineOptionEntryState.Downloaded -> throw IllegalStateException("Download already completed")
                OfflineOptionEntryState.Downloading, OfflineOptionEntryState.Failed -> throw IllegalStateException(
                    "Download already in progress",
                )
                OfflineOptionEntryState.Suspended -> throw IllegalStateException("Download is suspended")
                else -> {}
            }
            val minimumBitRate = request.getIntOrNull("minimumBitrate")?.also {
                if (it < 0) throw IllegalArgumentException("Invalid download request")
            }
            val audioOptionIds = request.getStringArray("audioOptionIds")?.filterNotNull()
            val textOptionIds = request.getStringArray("textOptionIds")?.filterNotNull()

            process(OfflineDownloadRequest(minimumBitRate, audioOptionIds, textOptionIds))
        }
    }

    /**
     * Resumes all suspended actions.
     * @param nativeId Target offline manager.
     */
    @ReactMethod
    fun resume(nativeId: NativeId, promise: Promise) {
        promise.resolveWithBridge(nativeId) {
            resume()
        }
    }

    /**
     * Suspends all active actions.
     * @param nativeId Target offline manager.
     */
    @ReactMethod
    fun suspend(nativeId: NativeId, promise: Promise) {
        promise.resolveWithBridge(nativeId) {
            suspend()
        }
    }

    /**
     * Cancels and deletes the current download.
     * @param nativeId Target offline manager.
     */
    @ReactMethod
    fun cancelDownload(nativeId: NativeId, promise: Promise) {
        promise.resolveWithBridge(nativeId) {
            cancelDownload()
        }
    }

    /**
     * Resolve `nativeId`'s current `usedStorage`.
     * @param nativeId Target offline manager.
     */
    @ReactMethod
    fun usedStorage(nativeId: NativeId, promise: Promise) {
        promise.resolveWithBridge(nativeId) {
            offlineContentManager.usedStorage.toDouble()
        }
    }

    /**
     * Deletes everything related to the related content ID.
     * @param nativeId Target offline manager.
     */
    @ReactMethod
    fun deleteAll(nativeId: NativeId, promise: Promise) {
        promise.resolveWithBridge(nativeId) {
            deleteAll()
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
        promise.resolveWithBridge(nativeId) {
            downloadLicense()
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
        promise.resolveWithBridge(nativeId) {
            releaseLicense()
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
        promise.resolveWithBridge(nativeId) {
            renewOfflineLicense()
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
        promise.resolveWithBridge(nativeId) {
            release()
            offlineContentManagerBridges.remove(nativeId)
        }
    }

    private fun <T>Promise.resolveWithBridge(
        nativeId: NativeId,
        runBlock: OfflineContentManagerBridge.() -> T,
    ) {
        resolveOnCurrentThread {
            getOfflineContentManagerBridge(nativeId).runBlock()
        }
    }
}
