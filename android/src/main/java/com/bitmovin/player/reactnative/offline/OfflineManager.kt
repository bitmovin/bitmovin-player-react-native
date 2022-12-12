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

    fun deleteAll() {
        contentManager.deleteAll()
    }

    fun downloadLicense() {
        contentManager.downloadLicense()
    }

    fun getOptions() {
        contentManager.getOptions()
    }

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
        ids: List<String?>,
        potentialOptions: List<OfflineOptionEntry>
    ) {
        ids.forEach { idToDownload ->
            potentialOptions.forEach { option ->
                if (idToDownload === option.id && option.action != OfflineOptionEntryAction.Download) {
                    option.action = OfflineOptionEntryAction.Download
                }
            }
        }
    }

    fun release() {
        contentManager.release()
    }

    fun releaseLicense() {
        contentManager.releaseLicense()
    }

    fun renewOfflineLicense() {
        contentManager.renewOfflineLicense()
    }

    fun resume() {
        contentManager.resume()
    }

    fun suspend() {
        contentManager.suspend()
    }

    fun aggregateState(options: OfflineContentOptions?): String {
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

    override fun onCompleted(source: SourceConfig?, options: OfflineContentOptions?) {
        this.contentOptions = options
        sendEvent("onCompleted", Arguments.createMap().apply {
            putMap("options", JsonConverter.toJson(options))
            putString("state", aggregateState(options))
        })
    }

    override fun onError(source: SourceConfig?, event: ErrorEvent?) {
        sendEvent("onError", Arguments.createMap().apply {
            event?.code?.value?.let { putInt("code", it) }
            putString("message", event?.message)
        })
    }

    override fun onProgress(source: SourceConfig?, progress: Float) {
        sendEvent("onProgress", Arguments.createMap().apply {
            putDouble("progress", progress.toDouble())
        })
    }

    override fun onOptionsAvailable(source: SourceConfig?, options: OfflineContentOptions?) {
        this.contentOptions = options
        sendEvent("onOptionsAvailable", Arguments.createMap().apply {
            putMap("options", JsonConverter.toJson(options))
            putString("state", aggregateState(options))
        })
    }

    override fun onDrmLicenseUpdated(source: SourceConfig?) {
        sendEvent("onDrmLicenseUpdated")
    }

    override fun onSuspended(source: SourceConfig?) {
        sendEvent("onSuspended")
    }

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