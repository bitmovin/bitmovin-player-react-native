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

class OfflineManager(
    private val nativeId: NativeId,
    private val context: ReactApplicationContext,
    source: SourceConfig,
    location: String
) :
    OfflineContentManagerListener {

    val contentManager: OfflineContentManager
    var contentOptions: OfflineContentOptions? = null
        private set

    init {
        contentManager = OfflineContentManager.getOfflineContentManager(
            source, location, nativeId, this, context
        )
    }

    fun getOptions() {
        contentManager.getOptions()
    }

    /**
     * Process the `OfflineDownloadRequest`.
     * The `OfflineContentOptions` are stored in memory in this class because they can not be constructed to pass to the process call.
     * We're copying the iOS interface for the `minimumBitrate` so that react-native will have a consistent interface.
     *
     */
    fun process(request: OfflineDownloadRequest) {
        if (contentOptions != null) {
            contentOptions!!.videoOptions
                .firstOrNull { option -> option.bitrate >= request.minimumBitrate }
                ?.let { option -> option.action = OfflineOptionEntryAction.Download }
            changeToDownloadAction(request.audioOptionIds, contentOptions!!.audioOptions)
            changeToDownloadAction(request.textOptionIds, contentOptions!!.textOptions)

            contentManager.process(contentOptions!!)
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
        contentManager.resume()
    }

    fun suspend() {
        contentManager.suspend()
    }

    fun deleteAll() {
        contentManager.deleteAll()
    }

    fun downloadLicense() {
        contentManager.downloadLicense()
    }

    fun releaseLicense() {
        contentManager.releaseLicense()
    }

    fun renewOfflineLicense() {
        contentManager.renewOfflineLicense()
    }

    fun release() {
        contentManager.release()
    }

    /**
     * Produces an aggregate state of the `OfflineOptionEntryState` for the `OfflineContentOptions`
     * iOS does not have granular data access to the states of each entry, but instead provides a single aggregate status.
     * Adding this produces a consistent interface in the react-native layer.
     */
    private fun aggregateState(options: OfflineContentOptions?): String {
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


        return (state ?: OfflineOptionEntryState.NotDownloaded).name
    }

    /**
     * Called when a process call has completed.
     */
    override fun onCompleted(source: SourceConfig?, options: OfflineContentOptions?) {
        this.contentOptions = options
        sendEvent("onCompleted", Arguments.createMap().apply {
            putMap("options", JsonConverter.toJson(options))
            putString("state", aggregateState(options))
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
            putString("state", aggregateState(options))
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
        e.putString("eventType", eventType)

        context
            .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
            .emit("BitmovinOfflineEvent", e)
    }
}