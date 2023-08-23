package com.bitmovin.player.reactnative.offline

import com.bitmovin.player.api.deficiency.ErrorEvent
import com.bitmovin.player.api.offline.OfflineContentManager
import com.bitmovin.player.api.offline.OfflineContentManagerListener
import com.bitmovin.player.api.offline.options.*
import com.bitmovin.player.api.source.SourceConfig
import com.bitmovin.player.reactnative.NativeId
import com.bitmovin.player.reactnative.converter.JsonConverter
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.WritableMap
import com.facebook.react.modules.core.DeviceEventManagerModule

class OfflineContentManagerHolder(
    private val nativeId: NativeId,
    private val context: ReactApplicationContext,
    private val identifier: String,
    source: SourceConfig,
    location: String
) : OfflineContentManagerListener {

    val offlineContentManager: OfflineContentManager = OfflineContentManager.getOfflineContentManager(
        source, location, identifier, this, context
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
            val setDownloadAction: (VideoOfflineOptionEntry) -> Unit = { option ->
                option.action = OfflineOptionEntryAction.Download
            }

            val sortedVideoOptions = contentOptions!!.videoOptions
                    .sortedBy { option -> option.bitrate }
            request.minimumBitrate?.let { minimumBitrate ->
                sortedVideoOptions
                        .firstOrNull { option -> option.bitrate >= minimumBitrate }
                        ?.let(setDownloadAction)
            } ?: sortedVideoOptions.lastOrNull()
                    ?.let(setDownloadAction)
            changeToDownloadAction(request.audioOptionIds, contentOptions!!.audioOptions)
            changeToDownloadAction(request.textOptionIds, contentOptions!!.textOptions)

            offlineContentManager.process(contentOptions!!)
        }
    }

    private fun changeToDownloadAction(
        ids: List<String?>?,
        potentialOptions: List<OfflineOptionEntry>
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
        sendEvent("onCanceled")
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
        sendEvent("onCompleted", Arguments.createMap().apply {
            putMap("options", JsonConverter.toJson(options))
        })
    }

    /**
     * Called when an error occurs.
     */
    override fun onError(source: SourceConfig?, event: ErrorEvent?) {
        sendEvent("onError", Arguments.createMap().apply {
            event?.code?.value?.let { putInt("code", it) }
            putString("message", event?.message)
        })
    }

    /**
     * Called when the progress for a process call changes.
     */
    override fun onProgress(source: SourceConfig?, progress: Float) {
        sendEvent("onProgress", Arguments.createMap().apply {
            putDouble("progress", progress.toDouble())
        })
    }

    /**
     * Called after a getOptions or when am OfflineOptionEntry has been updated during a process call.
     */
    override fun onOptionsAvailable(source: SourceConfig?, options: OfflineContentOptions?) {
        this.contentOptions = options
        sendEvent("onOptionsAvailable", Arguments.createMap().apply {
            putMap("options", JsonConverter.toJson(options))
        })
    }

    /**
     * Called when the DRM license was updated.
     */
    override fun onDrmLicenseUpdated(source: SourceConfig?) {
        sendEvent("onDrmLicenseUpdated")
    }

    /**
     * Called when all actions have been suspended.
     */
    override fun onSuspended(source: SourceConfig?) {
        sendEvent("onSuspended")
    }

    /**
     * Called when all actions have been resumed.
     */
    override fun onResumed(source: SourceConfig?) {
        sendEvent("onResumed")
    }

    private fun sendEvent(eventType: String) {
        sendEvent(eventType, null)
    }

    private fun sendEvent(eventType: String, event: WritableMap?) {
        val e = event ?: Arguments.createMap()
        e.putString("nativeId", nativeId)
        e.putString("identifier", identifier)
        e.putString("eventType", eventType)
        e.putString("state", aggregateState(contentOptions).name)

        context
            .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
            .emit("BitmovinOfflineEvent", e)
    }
}
