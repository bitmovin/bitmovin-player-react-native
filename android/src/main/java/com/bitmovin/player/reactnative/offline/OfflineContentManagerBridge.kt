package com.bitmovin.player.reactnative.offline

import com.bitmovin.player.api.deficiency.ErrorEvent
import com.bitmovin.player.api.offline.OfflineContentManager
import com.bitmovin.player.api.offline.OfflineContentManagerListener
import com.bitmovin.player.api.offline.options.OfflineContentOptions
import com.bitmovin.player.api.offline.options.OfflineOptionEntry
import com.bitmovin.player.api.offline.options.OfflineOptionEntryAction
import com.bitmovin.player.api.offline.options.OfflineOptionEntryState
import com.bitmovin.player.api.source.SourceConfig
import com.bitmovin.player.reactnative.NativeId
import com.bitmovin.player.reactnative.converter.JsonConverter
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.WritableMap
import com.facebook.react.modules.core.DeviceEventManagerModule

class OfflineContentManagerBridge(
    private val nativeId: NativeId,
    private val context: ReactApplicationContext,
    private val identifier: String,
    source: SourceConfig,
    location: String,
) : OfflineContentManagerListener {

    enum class OfflineEventType(val eventName: String) {
        ON_COMPLETED("onCompleted"),
        ON_ERROR("onError"),
        ON_PROGRESS("onProgress"),
        ON_OPTIONS_AVAILABLE("onOptionsAvailable"),
        ON_DRM_LICENSE_UPDATED("onDrmLicenseUpdated"),
        ON_SUSPENDED("onSuspended"),
        ON_RESUMED("onResumed"),
        ON_CANCELED("onCanceled"),
    }

    val offlineContentManager: OfflineContentManager = OfflineContentManager.getOfflineContentManager(
        source,
        location,
        identifier,
        this,
        context,
    )
    private var contentOptions: OfflineContentOptions? = null

    val state: OfflineOptionEntryState
        get() = aggregateState(contentOptions)

    fun getOptions() {
        offlineContentManager.getOptions()
    }

    /**
     * Process the `OfflineDownloadRequest`.
     * The `OfflineContentOptions` are stored in memory in this class because they can not be constructed to pass to the process call.
     * We're copying the iOS interface for the `minimumBitrate` so that react-native will have a consistent interface.
     * When no `minimumBitrate` is provided, the highest bitrate will be downloaded.
     */
    fun process(request: OfflineDownloadRequest) {
        if (contentOptions != null) {
            val sortedVideoOptions = contentOptions!!.videoOptions
                .sortedBy { option -> option.bitrate }
            if (request.minimumBitrate == null) {
                sortedVideoOptions.lastOrNull()
            } else {
                sortedVideoOptions
                    .firstOrNull { option -> option.bitrate >= request.minimumBitrate }
            }?.apply {
                action = OfflineOptionEntryAction.Download
            }
            appliesDownloadActions(request.audioOptionIds, contentOptions!!.audioOptions)
            appliesDownloadActions(request.textOptionIds, contentOptions!!.textOptions)

            offlineContentManager.process(contentOptions!!)
        }
    }

    private fun appliesDownloadActions(
        ids: List<String?>?,
        potentialOptions: List<OfflineOptionEntry>,
    ) {
        if (ids.isNullOrEmpty()) {
            return
        }

        ids.forEach { idToDownload ->
            potentialOptions.forEach { option ->
                if (idToDownload == option.id && option.action !== OfflineOptionEntryAction.Download) {
                    option.action = OfflineOptionEntryAction.Download
                }
            }
        }
    }

    fun resume() {
        offlineContentManager.resume()
    }

    fun suspend() {
        offlineContentManager.suspend()
    }

    fun cancelDownload() {
        suspend()
        deleteAll()
        sendEvent(OfflineEventType.ON_CANCELED)
    }

    fun deleteAll() {
        offlineContentManager.deleteAll()
    }

    fun downloadLicense() {
        offlineContentManager.downloadLicense()
    }

    fun releaseLicense() {
        offlineContentManager.releaseLicense()
    }

    fun renewOfflineLicense() {
        offlineContentManager.renewOfflineLicense()
    }

    fun release() {
        offlineContentManager.release()
    }

    /**
     * Produces an aggregate state of the `OfflineOptionEntryState` for the `OfflineContentOptions`
     * iOS does not have granular data access to the states of each entry, but instead provides a single aggregate status.
     * Adding this produces a consistent interface in the react-native layer.
     */
    private fun aggregateState(options: OfflineContentOptions?): OfflineOptionEntryState {
        val allOptions = mutableListOf<OfflineOptionEntry>()
        options?.videoOptions?.let { allOptions.addAll(it) }
        options?.audioOptions?.let { allOptions.addAll(it) }
        options?.textOptions?.let { allOptions.addAll(it) }
        val trackableStates =
            listOf(OfflineOptionEntryState.Suspended, OfflineOptionEntryState.Downloading)

        var state = allOptions.firstOrNull { trackableStates.contains(it.state) }?.state

        if (state == null && allOptions.any { it.state == OfflineOptionEntryState.Downloaded }) {
            state = OfflineOptionEntryState.Downloaded
        }

        return state ?: OfflineOptionEntryState.NotDownloaded
    }

    /**
     * Called when a process call has completed.
     */
    override fun onCompleted(source: SourceConfig?, options: OfflineContentOptions?) {
        this.contentOptions = options
        sendEvent(
            OfflineEventType.ON_COMPLETED,
            Arguments.createMap().apply {
                putMap("options", JsonConverter.toJson(options))
            },
        )
    }

    /**
     * Called when an error occurs.
     */
    override fun onError(source: SourceConfig?, event: ErrorEvent?) {
        sendEvent(
            OfflineEventType.ON_ERROR,
            Arguments.createMap().apply {
                event?.code?.value?.let { putInt("code", it) }
                putString("message", event?.message)
            },
        )
    }

    /**
     * Called when the progress for a process call changes.
     */
    override fun onProgress(source: SourceConfig?, progress: Float) {
        sendEvent(
            OfflineEventType.ON_PROGRESS,
            Arguments.createMap().apply {
                putDouble("progress", progress.toDouble())
            },
        )
    }

    /**
     * Called after a getOptions or when am OfflineOptionEntry has been updated during a process call.
     */
    override fun onOptionsAvailable(source: SourceConfig?, options: OfflineContentOptions?) {
        this.contentOptions = options
        sendEvent(
            OfflineEventType.ON_OPTIONS_AVAILABLE,
            Arguments.createMap().apply {
                putMap("options", JsonConverter.toJson(options))
            },
        )
    }

    /**
     * Called when the DRM license was updated.
     */
    override fun onDrmLicenseUpdated(source: SourceConfig?) {
        sendEvent(OfflineEventType.ON_DRM_LICENSE_UPDATED)
    }

    /**
     * Called when all actions have been suspended.
     */
    override fun onSuspended(source: SourceConfig?) {
        sendEvent(OfflineEventType.ON_SUSPENDED)
    }

    /**
     * Called when all actions have been resumed.
     */
    override fun onResumed(source: SourceConfig?) {
        sendEvent(OfflineEventType.ON_RESUMED)
    }

    private fun sendEvent(eventType: OfflineEventType, event: WritableMap? = null) {
        val e = event ?: Arguments.createMap()
        e.putString("nativeId", nativeId)
        e.putString("identifier", identifier)
        e.putString("eventType", eventType.eventName)
        e.putString("state", aggregateState(contentOptions).name)

        context
            .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
            .emit("BitmovinOfflineEvent", e)
    }
}
