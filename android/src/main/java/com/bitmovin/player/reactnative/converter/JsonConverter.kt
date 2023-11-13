package com.bitmovin.player.reactnative.converter

import com.bitmovin.analytics.api.AnalyticsConfig
import com.bitmovin.analytics.api.CustomData
import com.bitmovin.analytics.api.DefaultMetadata
import com.bitmovin.analytics.api.SourceMetadata
import com.bitmovin.player.api.DeviceDescription.DeviceName
import com.bitmovin.player.api.PlaybackConfig
import com.bitmovin.player.api.PlayerConfig
import com.bitmovin.player.api.TweaksConfig
import com.bitmovin.player.api.advertising.Ad
import com.bitmovin.player.api.advertising.AdBreak
import com.bitmovin.player.api.advertising.AdConfig
import com.bitmovin.player.api.advertising.AdData
import com.bitmovin.player.api.advertising.AdItem
import com.bitmovin.player.api.advertising.AdQuartile
import com.bitmovin.player.api.advertising.AdSource
import com.bitmovin.player.api.advertising.AdSourceType
import com.bitmovin.player.api.advertising.AdvertisingConfig
import com.bitmovin.player.api.buffer.BufferConfig
import com.bitmovin.player.api.buffer.BufferLevel
import com.bitmovin.player.api.buffer.BufferMediaTypeConfig
import com.bitmovin.player.api.buffer.BufferType
import com.bitmovin.player.api.casting.RemoteControlConfig
import com.bitmovin.player.api.drm.WidevineConfig
import com.bitmovin.player.api.event.PlayerEvent
import com.bitmovin.player.api.event.SourceEvent
import com.bitmovin.player.api.event.data.CastPayload
import com.bitmovin.player.api.event.data.SeekPosition
import com.bitmovin.player.api.live.LiveConfig
import com.bitmovin.player.api.media.AdaptationConfig
import com.bitmovin.player.api.media.MediaType
import com.bitmovin.player.api.media.audio.AudioTrack
import com.bitmovin.player.api.media.subtitle.SubtitleTrack
import com.bitmovin.player.api.media.thumbnail.Thumbnail
import com.bitmovin.player.api.media.thumbnail.ThumbnailTrack
import com.bitmovin.player.api.media.video.quality.VideoQuality
import com.bitmovin.player.api.offline.options.OfflineContentOptions
import com.bitmovin.player.api.offline.options.OfflineOptionEntry
import com.bitmovin.player.api.source.Source
import com.bitmovin.player.api.source.SourceConfig
import com.bitmovin.player.api.source.SourceOptions
import com.bitmovin.player.api.source.SourceType
import com.bitmovin.player.api.source.TimelineReferencePoint
import com.bitmovin.player.api.ui.PlayerViewConfig
import com.bitmovin.player.api.ui.ScalingMode
import com.bitmovin.player.api.ui.StyleConfig
import com.bitmovin.player.api.ui.UiConfig
import com.bitmovin.player.reactnative.BitmovinCastManagerOptions
import com.bitmovin.player.reactnative.RNBufferLevels
import com.bitmovin.player.reactnative.RNPlayerViewConfigWrapper
import com.bitmovin.player.reactnative.extensions.get
import com.bitmovin.player.reactnative.extensions.getBooleanOrNull
import com.bitmovin.player.reactnative.extensions.getName
import com.bitmovin.player.reactnative.extensions.putBoolean
import com.bitmovin.player.reactnative.extensions.putDouble
import com.bitmovin.player.reactnative.extensions.putInt
import com.bitmovin.player.reactnative.extensions.set
import com.bitmovin.player.reactnative.extensions.toMapList
import com.bitmovin.player.reactnative.extensions.toReadableArray
import com.bitmovin.player.reactnative.extensions.toReadableMap
import com.bitmovin.player.reactnative.extensions.withArray
import com.bitmovin.player.reactnative.extensions.withBoolean
import com.bitmovin.player.reactnative.extensions.withDouble
import com.bitmovin.player.reactnative.extensions.withInt
import com.bitmovin.player.reactnative.extensions.withMap
import com.bitmovin.player.reactnative.extensions.withString
import com.bitmovin.player.reactnative.extensions.withStringArray
import com.bitmovin.player.reactnative.ui.RNPictureInPictureHandler.PictureInPictureConfig
import com.facebook.react.bridge.*
import java.util.UUID

/**
 * Converts an arbitrary `json` to `PlayerConfig`.
 */
fun ReadableMap.toPlayerConfig(): PlayerConfig = PlayerConfig(key = getString("licenseKey")).apply {
    withMap("playbackConfig") { playbackConfig = it.toPlaybackConfig() }
    withMap("styleConfig") { styleConfig = it.toStyleConfig() }
    withMap("tweaksConfig") { tweaksConfig = it.toTweaksConfig() }
    getMap("advertisingConfig")?.toAdvertisingConfig()?.let { advertisingConfig = it }
    withMap("adaptationConfig") { adaptationConfig = it.toAdaptationConfig() }
    withMap("remoteControlConfig") { remoteControlConfig = it.toRemoteControlConfig() }
    withMap("bufferConfig") { bufferConfig = it.toBufferConfig() }
    withMap("liveConfig") { liveConfig = it.toLiveConfig() }
}

/**
 * Converts any JS object into a `BufferMediaTypeConfig` object.
 */
fun ReadableMap.toBufferMediaTypeConfig(): BufferMediaTypeConfig = BufferMediaTypeConfig().apply {
    withDouble("forwardDuration") { forwardDuration = it }
}

/**
 * Converts any JS object into a `BufferConfig` object.
 */
fun ReadableMap.toBufferConfig(): BufferConfig = BufferConfig().apply {
    withMap("audioAndVideo") { audioAndVideo = it.toBufferMediaTypeConfig() }
    withDouble("restartThreshold") { restartThreshold = it }
    withDouble("startupThreshold") { startupThreshold = it }
}

/**
 * Converts an arbitrary [ReadableMap] to a [RemoteControlConfig].
 */
private fun ReadableMap.toRemoteControlConfig(): RemoteControlConfig = RemoteControlConfig().apply {
    withString("receiverStylesheetUrl") { receiverStylesheetUrl = it }
    withMap("customReceiverConfig") { customReceiverConfig = it.castValues() }
    withBoolean("isCastEnabled") { isCastEnabled = it }
    withBoolean("sendManifestRequestsWithCredentials") { sendManifestRequestsWithCredentials = it }
    withBoolean("sendSegmentRequestsWithCredentials") { sendSegmentRequestsWithCredentials = it }
    withBoolean("sendDrmLicenseRequestsWithCredentials") { sendDrmLicenseRequestsWithCredentials = it }
}

/**
 * Converts an arbitrary `json` to `SourceOptions`.
 */
fun ReadableMap.toSourceOptions(): SourceOptions = SourceOptions(
    startOffset = getDouble("startOffset"),
    startOffsetTimelineReference = getString("startOffsetTimelineReference")?.toTimelineReferencePoint(),
)

/**
 * Converts an arbitrary `json` to `TimelineReferencePoint`.
 */
private fun String.toTimelineReferencePoint(): TimelineReferencePoint? = when (this) {
    "start" -> TimelineReferencePoint.Start
    "end" -> TimelineReferencePoint.End
    else -> null
}

/**
 * Converts an arbitrary `json` to `AdaptationConfig`.
 */
private fun ReadableMap.toAdaptationConfig(): AdaptationConfig = AdaptationConfig().apply {
    withInt("maxSelectableBitrate") { maxSelectableVideoBitrate = it }
}

/**
 * Converts any JS object into a `PlaybackConfig` object.
 */
fun ReadableMap.toPlaybackConfig(): PlaybackConfig = PlaybackConfig().apply {
    withBoolean("isAutoplayEnabled") { isAutoplayEnabled = it }
    withBoolean("isMuted") { isMuted = it }
    withBoolean("isTimeShiftEnabled") { isTimeShiftEnabled = it }
}

/**
 * Converts any JS object into a `StyleConfig` object.
 */
fun ReadableMap.toStyleConfig(): StyleConfig = StyleConfig().apply {
    withBoolean("isUiEnabled") { isUiEnabled = it }
    getString("playerUiCss")?.takeIf { it.isNotEmpty() }?.let { playerUiCss = it }
    getString("supplementalPlayerUiCss")?.takeIf { it.isNotEmpty() }?.let { supplementalPlayerUiCss = it }
    getString("playerUiJs")?.takeIf { it.isNotEmpty() }?.let { playerUiJs = it }
    withString("scalingMode") { scalingMode = ScalingMode.valueOf(it) }
}

/**
 * Converts any JS object into a `TweaksConfig` object.
 */
fun ReadableMap.toTweaksConfig(): TweaksConfig = TweaksConfig().apply {
    withDouble("timeChangedInterval") { timeChangedInterval = it }
    withInt("bandwidthEstimateWeightLimit") { bandwidthEstimateWeightLimit = it }
    withMap("devicesThatRequireSurfaceWorkaround") { devices ->
        val deviceNames = devices.withStringArray("deviceNames") {
            it.filterNotNull().map(::DeviceName)
        } ?: emptyList()
        val modelNames = devices.withStringArray("modelNames") {
            it.filterNotNull().map(::DeviceName)
        } ?: emptyList()
        devicesThatRequireSurfaceWorkaround = deviceNames + modelNames
    }
    withBoolean("languagePropertyNormalization") { languagePropertyNormalization = it }
    withDouble("localDynamicDashWindowUpdateInterval") { localDynamicDashWindowUpdateInterval = it }
    withBoolean("shouldApplyTtmlRegionWorkaround") { shouldApplyTtmlRegionWorkaround = it }
    withBoolean("useDrmSessionForClearPeriods") { useDrmSessionForClearPeriods = it }
    withBoolean("useDrmSessionForClearSources") { useDrmSessionForClearSources = it }
    withBoolean("useFiletypeExtractorFallbackForHls") { useFiletypeExtractorFallbackForHls = it }
}

/**
 * Converts any JS object into an `AdvertisingConfig` object.
 */
fun ReadableMap.toAdvertisingConfig(): AdvertisingConfig? {
    return AdvertisingConfig(
        getArray("schedule")?.toMapList()?.mapNotNull { it?.toAdItem() } ?: return null,
    )
}

/**
 * Converts any JS object into an `AdItem` object.
 */
fun ReadableMap.toAdItem(): AdItem? {
    return AdItem(
        sources = getArray("sources") ?.toMapList()?.mapNotNull { it?.toAdSource() }?.toTypedArray() ?: return null,
        position = getString("position") ?: "pre",
    )
}

/**
 * Converts any JS object into an `AdSource` object.
 */
fun ReadableMap.toAdSource(): AdSource? {
    return AdSource(
        type = getString("type")?.toAdSourceType() ?: return null,
        tag = getString("tag") ?: return null,
    )
}

/**
 * Converts any JS string into an `AdSourceType` enum value.
 */
private fun String.toAdSourceType(): AdSourceType? = when (this) {
    "ima" -> AdSourceType.Ima
    "progressive" -> AdSourceType.Progressive
    "unknown" -> AdSourceType.Unknown
    else -> null
}

/**
 * Converts an arbitrary `json` to `SourceConfig`.
 */
fun ReadableMap.toSourceConfig(): SourceConfig? {
    val url = getString("url")
    val type = getString("type")?.toSourceType()
    if (url == null || type == null) {
        return null
    }
    return SourceConfig(url, type).apply {
        withString("title") { title = it }
        withString("description") { description = it }
        withString("poster") { posterSource = it }
        withBoolean("isPosterPersistent") { isPosterPersistent = it }
        withArray("subtitleTracks") { subtitleTracks ->
            for (i in 0 until subtitleTracks.size()) {
                subtitleTracks.getMap(i).toSubtitleTrack()?.let {
                    addSubtitleTrack(it)
                }
            }
        }
        withString("thumbnailTrack") { thumbnailTrack = it.toThumbnailTrack() }
        withMap("metadata") { metadata = it.castValues() }
        withMap("options") { options = it.toSourceOptions() }
    }
}

/**
 * Converts an arbitrary `json` to `SourceType`.
 */
fun String.toSourceType(): SourceType? = when (this) {
    "dash" -> SourceType.Dash
    "hls" -> SourceType.Hls
    "smooth" -> SourceType.Smooth
    "progressive" -> SourceType.Progressive
    else -> null
}

/**
 * Converts any given `Source` object into its `json` representation.
 */
fun Source.toJson(): WritableMap = Arguments.createMap().apply {
    putDouble("duration", duration)
    putBoolean("isActive", isActive)
    putBoolean("isAttachedToPlayer", isAttachedToPlayer)
    putInt("loadingState", loadingState.ordinal)
    putMap("metadata", config.metadata?.toReadableMap())
}

/**
 * Converts any given `SeekPosition` object into its `json` representation.
 */
fun SeekPosition.toJson(): WritableMap = Arguments.createMap().apply {
    putDouble("time", time)
    putMap("source", source.toJson())
}

/**
 * Converts any given `SourceEvent` object into its `json` representation.
 */
fun SourceEvent.toJson(): WritableMap {
    val json = Arguments.createMap()
    json.putString("name", getName())
    json.putDouble("timestamp", timestamp.toDouble())
    when (this) {
        is SourceEvent.Load -> {
            json.putMap("source", source.toJson())
        }

        is SourceEvent.Loaded -> {
            json.putMap("source", source.toJson())
        }

        is SourceEvent.Error -> {
            json.putInt("code", code.value)
            json.putString("message", message)
        }

        is SourceEvent.Warning -> {
            json.putInt("code", code.value)
            json.putString("message", message)
        }

        is SourceEvent.AudioTrackAdded -> {
            json.putMap("audioTrack", audioTrack.toJson())
        }

        is SourceEvent.AudioTrackChanged -> {
            json.putMap("oldAudioTrack", oldAudioTrack?.toJson())
            json.putMap("newAudioTrack", newAudioTrack?.toJson())
        }

        is SourceEvent.AudioTrackRemoved -> {
            json.putMap("audioTrack", audioTrack.toJson())
        }

        is SourceEvent.SubtitleTrackAdded -> {
            json.putMap("subtitleTrack", subtitleTrack.toJson())
        }

        is SourceEvent.SubtitleTrackRemoved -> {
            json.putMap("subtitleTrack", subtitleTrack.toJson())
        }

        is SourceEvent.SubtitleTrackChanged -> {
            json.putMap("oldSubtitleTrack", oldSubtitleTrack?.toJson())
            json.putMap("newSubtitleTrack", newSubtitleTrack?.toJson())
        }

        is SourceEvent.DownloadFinished -> {
            json.putDouble("downloadTime", downloadTime)
            json.putString("requestType", downloadType.toString())
            json.putInt("httpStatus", httpStatus)
            json.putBoolean("isSuccess", isSuccess)
            lastRedirectLocation?.let {
                json.putString("lastRedirectLocation", it)
            }
            json.putDouble("size", size.toDouble())
            json.putString("url", url)
        }

        is SourceEvent.VideoDownloadQualityChanged -> {
            json.putMap("newVideoQuality", newVideoQuality?.toJson())
            json.putMap("oldVideoQuality", oldVideoQuality?.toJson())
        }

        else -> {
            // Event is not supported yet or does not have any additional data
        }
    }
    return json
}

/**
 * Converts any given `PlayerEvent` object into its `json` representation.
 */
fun PlayerEvent.toJson(): WritableMap {
    val json = Arguments.createMap()
    json.putString("name", getName())
    json.putDouble("timestamp", timestamp.toDouble())
    when (this) {
        is PlayerEvent.Error -> {
            json.putInt("code", code.value)
            json.putString("message", message)
        }

        is PlayerEvent.Warning -> {
            json.putInt("code", code.value)
            json.putString("message", message)
        }

        is PlayerEvent.Play -> {
            json.putDouble("time", time)
        }

        is PlayerEvent.Playing -> {
            json.putDouble("time", time)
        }

        is PlayerEvent.Paused -> {
            json.putDouble("time", time)
        }

        is PlayerEvent.TimeChanged -> {
            json.putDouble("currentTime", time)
        }

        is PlayerEvent.Seek -> {
            json.putMap("from", from.toJson())
            json.putMap("to", to.toJson())
        }

        is PlayerEvent.TimeShift -> {
            json.putDouble("position", position)
            json.putDouble("targetPosition", target)
        }

        is PlayerEvent.PictureInPictureAvailabilityChanged -> {
            json.putBoolean("isPictureInPictureAvailable", isPictureInPictureAvailable)
        }

        is PlayerEvent.AdBreakFinished -> {
            json.putMap("adBreak", adBreak?.toJson())
        }

        is PlayerEvent.AdBreakStarted -> {
            json.putMap("adBreak", adBreak?.toJson())
        }

        is PlayerEvent.AdClicked -> {
            json.putString("clickThroughUrl", clickThroughUrl)
        }

        is PlayerEvent.AdError -> {
            json.putInt("code", code)
            json.putString("message", message)
            json.putMap("adConfig", adConfig?.toJson())
            json.putMap("adItem", adItem?.toJson())
        }

        is PlayerEvent.AdFinished -> {
            json.putMap("ad", ad?.toJson())
        }

        is PlayerEvent.AdManifestLoad -> {
            json.putMap("adBreak", adBreak?.toJson())
            json.putMap("adConfig", adConfig.toJson())
        }

        is PlayerEvent.AdManifestLoaded -> {
            json.putMap("adBreak", adBreak?.toJson())
            json.putMap("adConfig", adConfig.toJson())
            json.putDouble("downloadTime", downloadTime.toDouble())
        }

        is PlayerEvent.AdQuartile -> {
            json.putString("quartile", quartile.toJson())
        }

        is PlayerEvent.AdScheduled -> {
            json.putInt("numberOfAds", numberOfAds)
        }

        is PlayerEvent.AdSkipped -> {
            json.putMap("ad", ad?.toJson())
        }

        is PlayerEvent.AdStarted -> {
            json.putMap("ad", ad?.toJson())
            json.putString("clickThroughUrl", clickThroughUrl)
            json.putString("clientType", clientType?.toJson())
            json.putDouble("duration", duration)
            json.putInt("indexInQueue", indexInQueue)
            json.putString("position", position)
            json.putDouble("skipOffset", skipOffset)
            json.putDouble("timeOffset", timeOffset)
        }

        is PlayerEvent.VideoPlaybackQualityChanged -> {
            json.putMap("newVideoQuality", newVideoQuality?.toJson())
            json.putMap("oldVideoQuality", oldVideoQuality?.toJson())
        }

        is PlayerEvent.CastWaitingForDevice -> {
            json.putMap("castPayload", castPayload.toJson())
        }

        is PlayerEvent.CastStarted -> {
            json.putString("deviceName", deviceName)
        }

        else -> {
            // Event is not supported yet or does not have any additional data
        }
    }
    return json
}

/**
 * Converts an arbitrary `json` into [BitmovinCastManagerOptions].
 */
fun ReadableMap.toCastOptions(): BitmovinCastManagerOptions = BitmovinCastManagerOptions(
    applicationId = getString("applicationId"),
    messageNamespace = getString("messageNamespace"),
)

/**
 * Converts an arbitrary `json` to `WidevineConfig`.
 */
fun ReadableMap.toWidevineConfig(): WidevineConfig? = getMap("widevine")?.run {
    WidevineConfig(getString("licenseUrl")).apply {
        withString("preferredSecurityLevel") { preferredSecurityLevel = it }
        withBoolean("shouldKeepDrmSessionsAlive") { shouldKeepDrmSessionsAlive = it }
        withMap("httpHeaders") { httpHeaders = it.castValues<String>().toMutableMap() }
    }
}

/**
 * Converts an `url` string into a `ThumbnailsTrack`.
 */
fun String.toThumbnailTrack(): ThumbnailTrack = ThumbnailTrack(this)

/**
 * Converts any `AudioTrack` into its json representation.
 */
fun AudioTrack.toJson(): WritableMap = Arguments.createMap().apply {
    putString("url", url)
    putString("label", label)
    putBoolean("isDefault", isDefault)
    putString("identifier", id)
    putString("language", language)
}

/**
 * Converts an arbitrary `json` into a `SubtitleTrack`.
 */
fun ReadableMap.toSubtitleTrack(): SubtitleTrack? {
    val url = this.getString("url")
    val label = this.getString("label")
    if (url == null || label == null) {
        return null
    }
    return SubtitleTrack(
        url = url,
        label = label,
        id = getString("identifier") ?: UUID.randomUUID().toString(),
        isDefault = getBoolean("isDefault"),
        language = getString("language"),
        isForced = getBoolean("isForced"),
        mimeType = getString("format")?.takeIf { it.isNotEmpty() }?.toSubtitleMimeType(),
    )
}

/**
 * Converts any subtitle format name in its mime type representation.
 */
private fun String.toSubtitleMimeType(): String = "text/$this"

/**
 * Converts any `SubtitleTrack` into its json representation.
 */
fun SubtitleTrack.toJson(): WritableMap = Arguments.createMap().apply {
    putString("url", url)
    putString("label", label)
    putBoolean("isDefault", isDefault)
    putString("identifier", id)
    putString("language", language)
    putBoolean("isForced", isForced)
    putString("format", mimeType?.textMimeTypeToJson())
}

/**
 * Converts any subtitle track mime type into its json representation (file format value).
 */
private fun String.textMimeTypeToJson(): String = split("/").last()

/**
 * Converts any `AdBreak` object into its json representation.
 */
fun AdBreak.toJson(): WritableMap = Arguments.createMap().apply {
    putArray("ads", ads.map { it.toJson() }.toReadableArray())
    putString("id", id)
    putDouble("scheduleTime", scheduleTime)
}

/**
 * Converts any `Ad` object into its json representation.
 */
fun Ad.toJson(): WritableMap = Arguments.createMap().apply {
    putString("clickThroughUrl", clickThroughUrl)
    putMap("data", data?.toJson())
    putInt("height", height)
    putString("id", id)
    putBoolean("isLinear", isLinear)
    putString("mediaFileUrl", mediaFileUrl)
    putInt("width", width)
}

/**
 * Converts any `AdData` object into its json representation.
 */
fun AdData.toJson(): WritableMap = Arguments.createMap().apply {
    putInt("bitrate", bitrate)
    putInt("maxBitrate", maxBitrate)
    putString("mimeType", mimeType)
    putInt("minBitrate", minBitrate)
}

/**
 * Converts any `AdConfig` object into its json representation.
 */
fun AdConfig.toJson(): WritableMap = Arguments.createMap().apply {
    putDouble("replaceContentDuration", replaceContentDuration)
}

/**
 * Converts any `AdItem` object into its json representation.
 */
fun AdItem.toJson(): WritableMap = Arguments.createMap().apply {
    putString("position", position)
    putArray("sources", sources.map { it.toJson() }.toReadableArray())
}

/**
 * Converts any `AdSource` object into its json representation.
 */
fun AdSource.toJson(): WritableMap = Arguments.createMap().apply {
    putString("tag", tag)
    putString("type", type.toJson())
}

/**
 * Converts any `AdSourceType` value into its json representation.
 */
fun AdSourceType.toJson(): String = when (this) {
    AdSourceType.Ima -> "ima"
    AdSourceType.Unknown -> "unknown"
    AdSourceType.Progressive -> "progressive"
}

/**
 * Converts any `AdQuartile` value into its json representation.
 */
fun AdQuartile.toJson(): String = when (this) {
    AdQuartile.FirstQuartile -> "first"
    AdQuartile.MidPoint -> "mid_point"
    AdQuartile.ThirdQuartile -> "third"
}

/**
 * Converts an arbitrary json object into a `BitmovinAnalyticsConfig`.
 */
fun ReadableMap.toAnalyticsConfig(): AnalyticsConfig? = getString("licenseKey")
    ?.let { AnalyticsConfig.Builder(it) }
    ?.apply {
        withBoolean("adTrackingDisabled") { setAdTrackingDisabled(it) }
        withBoolean("randomizeUserId") { setRandomizeUserId(it) }
    }?.build()

/**
 * Converts an arbitrary json object into an analytics `DefaultMetadata`.
 */
fun ReadableMap.toAnalyticsDefaultMetadata(): DefaultMetadata = DefaultMetadata.Builder().apply {
    setCustomData(toAnalyticsCustomData())
    withString("cdnProvider") { setCdnProvider(it) }
    withString("customUserId") { setCustomUserId(it) }
}.build()

/**
 * Converts an arbitrary json object into an analytics `CustomData`.
 */
fun ReadableMap.toAnalyticsCustomData(): CustomData = CustomData.Builder().apply {
    for (n in 1..30) {
        this[n] = getString("customData$n")
    }
    getString("experimentName")?.let {
        setExperimentName(it)
    }
}.build()

/**
 * Converts an arbitrary analytics `CustomData` object into a JS value.
 */
fun CustomData.toJson(): WritableMap = Arguments.createMap().also { json ->
    for (n in 1..30) {
        json.putStringIfNotNull("customData$n", this[n])
    }
    json.putStringIfNotNull("experimentName", experimentName)
}

fun ReadableMap.toAnalyticsSourceMetadata(): SourceMetadata = SourceMetadata(
    title = getString("title"),
    videoId = getString("videoId"),
    cdnProvider = getString("cdnProvider"),
    path = getString("path"),
    isLive = getBoolean("isLive"),
    customData = toAnalyticsCustomData(),
)

fun SourceMetadata.toJson(): ReadableMap = customData.toJson().also {
    it.putString("title", title)
    it.putString("videoId", videoId)
    it.putString("cdnProvider", cdnProvider)
    it.putString("path", path)
    it.putBoolean("isLive", isLive)
}

/**
 * Converts any `VideoQuality` value into its json representation.
 */
fun VideoQuality.toJson(): WritableMap = Arguments.createMap().apply {
    putString("id", id)
    putString("label", label)
    putInt("bitrate", bitrate)
    putString("codec", codec)
    putDouble("frameRate", frameRate.toDouble())
    putInt("height", height)
    putInt("width", width)
}

/**
 * Converts any `OfflineOptionEntry` into its json representation.
 */
fun OfflineOptionEntry.toJson(): WritableMap = Arguments.createMap().apply {
    putString("id", id)
    putString("language", language)
}

/**
 * Converts any `OfflineContentOptions` into its json representation.
 */
fun OfflineContentOptions.toJson(): WritableMap = Arguments.createMap().apply {
    putArray("audioOptions", audioOptions.map { it.toJson() }.toReadableArray())
    putArray("textOptions", textOptions.map { it.toJson() }.toReadableArray())
}

fun Thumbnail.toJson(): WritableMap = Arguments.createMap().apply {
    putDouble("start", start)
    putDouble("end", end)
    putString("text", text)
    putString("url", uri.toString())
    putInt("x", x)
    putInt("y", y)
    putInt("width", width)
    putInt("height", height)
}

fun ReadableMap.toPictureInPictureConfig(): PictureInPictureConfig = PictureInPictureConfig(
    isEnabled = getBoolean("isEnabled"),
)

/**
 * Converts the [json] to a `RNUiConfig` object.
 */
fun toPlayerViewConfig(json: ReadableMap) = PlayerViewConfig(
    uiConfig = UiConfig.WebUi(
        playbackSpeedSelectionEnabled = json.getMap("uiConfig")
            ?.getBooleanOrNull("playbackSpeedSelectionEnabled")
            ?: true,
    ),
)

/**
 * Converts the [this@toRNPlayerViewConfigWrapper] to a `RNPlayerViewConfig` object.
 */
fun ReadableMap.toRNPlayerViewConfigWrapper() = RNPlayerViewConfigWrapper(
    playerViewConfig = toPlayerViewConfig(this),
    pictureInPictureConfig = getMap("pictureInPictureConfig")?.toPictureInPictureConfig(),
)

/**
 * Converts any JS object into a [LiveConfig] object.
 */
fun ReadableMap.toLiveConfig(): LiveConfig = LiveConfig().apply {
    withDouble("minTimeshiftBufferDepth") { minTimeShiftBufferDepth = it }
}

/**
 * Converts any [MediaType] value into its json representation.
 */
fun MediaType.toJson(): String = when (this) {
    MediaType.Audio -> "audio"
    MediaType.Video -> "video"
}

/**
 * Converts any [BufferType] value into its json representation.
 */
fun BufferType.toJson(): String = when (this) {
    BufferType.ForwardDuration -> "forwardDuration"
    BufferType.BackwardDuration -> "backwardDuration"
}

fun BufferLevel.toJson(): WritableMap = Arguments.createMap().apply {
    putDouble("level", level)
    putDouble("targetLevel", targetLevel)
    putString("media", media.toJson())
    putString("type", type.toJson())
}

fun RNBufferLevels.toJson(): WritableMap = Arguments.createMap().apply {
    putMap("audio", audio.toJson())
    putMap("video", video.toJson())
}

/**
 * Maps a JS string into the corresponding [BufferType] value.
 */
fun String.toBufferType(): BufferType? = when (this) {
    "forwardDuration" -> BufferType.ForwardDuration
    "backwardDuration" -> BufferType.BackwardDuration
    else -> null
}

/**
 * Maps a JS string into the corresponding [MediaType] value.
 */
fun String.toMediaType(): MediaType? = when (this) {
    "audio" -> MediaType.Audio
    "video" -> MediaType.Video
    else -> null
}

/**
 * Converts a [CastPayload] object into its JS representation.
 */
private fun CastPayload.toJson(): WritableMap = Arguments.createMap().apply {
    putDouble("currentTime", currentTime)
    putString("deviceName", deviceName)
    putString("type", type)
}

private fun WritableMap.putStringIfNotNull(name: String, value: String?) = value?.let { putString(name, value) }

private inline fun <reified T> ReadableMap.castValues(): Map<String, T> = toHashMap().mapValues { it.value as T }
