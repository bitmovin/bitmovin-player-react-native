package com.bitmovin.player.reactnative.converter

import android.util.Base64
import com.bitmovin.analytics.api.AnalyticsConfig
import com.bitmovin.analytics.api.CustomData
import com.bitmovin.analytics.api.DefaultMetadata
import com.bitmovin.analytics.api.SourceMetadata
import com.bitmovin.player.reactnative.extensions.get
import com.bitmovin.player.reactnative.extensions.set
import com.bitmovin.player.api.BandwidthMeterType
import com.bitmovin.player.api.DeviceDescription.DeviceName
import com.bitmovin.player.api.ForceReuseVideoCodecReason
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
import com.bitmovin.player.api.decoder.DecoderPriorityProvider.DecoderContext
import com.bitmovin.player.api.decoder.MediaCodecInfo
import com.bitmovin.player.api.drm.WidevineConfig
import com.bitmovin.player.api.event.PlayerEvent
import com.bitmovin.player.api.event.SourceEvent
import com.bitmovin.player.api.event.data.CastPayload
import com.bitmovin.player.api.event.data.SeekPosition
import com.bitmovin.player.api.live.LiveConfig
import com.bitmovin.player.api.media.AdaptationConfig
import com.bitmovin.player.api.media.MediaTrackRole
import com.bitmovin.player.api.media.MediaType
import com.bitmovin.player.api.media.audio.AudioTrack
import com.bitmovin.player.api.media.subtitle.SubtitleTrack
import com.bitmovin.player.api.media.thumbnail.Thumbnail
import com.bitmovin.player.api.media.thumbnail.ThumbnailTrack
import com.bitmovin.player.api.media.video.quality.VideoQuality
import com.bitmovin.player.api.network.HttpRequest
import com.bitmovin.player.api.network.HttpRequestType
import com.bitmovin.player.api.network.HttpResponse
import com.bitmovin.player.api.network.NetworkConfig
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
import com.bitmovin.player.api.ui.SurfaceType
import com.bitmovin.player.api.ui.UiConfig
import com.bitmovin.player.reactnative.PictureInPictureConfig
import com.bitmovin.player.reactnative.RNBufferLevels
import com.bitmovin.player.reactnative.RNPlayerViewConfigWrapper
import com.bitmovin.player.reactnative.RNStyleConfigWrapper
import com.bitmovin.player.reactnative.UserInterfaceType
import com.bitmovin.player.reactnative.extensions.getArray
import com.bitmovin.player.reactnative.extensions.getBooleanOrNull
import com.bitmovin.player.reactnative.extensions.getDoubleOrNull
import com.bitmovin.player.reactnative.extensions.getInt
import com.bitmovin.player.reactnative.extensions.getMap
import com.bitmovin.player.reactnative.extensions.getName
import com.bitmovin.player.reactnative.extensions.getString
import com.bitmovin.player.reactnative.extensions.toBase64DataUri
import com.bitmovin.player.reactnative.extensions.toMap
import com.bitmovin.player.reactnative.extensions.toMapList
import com.bitmovin.player.reactnative.extensions.withArray
import com.bitmovin.player.reactnative.extensions.withBoolean
import com.bitmovin.player.reactnative.extensions.withDouble
import com.bitmovin.player.reactnative.extensions.withInt
import com.bitmovin.player.reactnative.extensions.withMap
import com.bitmovin.player.reactnative.extensions.withString
import com.bitmovin.player.reactnative.extensions.withStringArray
import java.util.UUID

/**
 * Filters out null values from a map to ensure compatibility with Expo modules
 */
private fun Map<String, Any?>.filterNotNullValues(): Map<String, Any> =
    this.filterValues { it != null }.mapValues { it.value!! }

/**
 * Converts an arbitrary `json` to `PlayerConfig`.
 */
fun Map<String, Any?>.toPlayerConfig(): PlayerConfig = PlayerConfig(key = getString("licenseKey")).apply {
    withMap("playbackConfig") { playbackConfig = it.toPlaybackConfig() }
    withMap("styleConfig") { styleConfig = it.toStyleConfig() }
    withMap("tweaksConfig") { tweaksConfig = it.toTweaksConfig() }
    getMap("advertisingConfig")?.toAdvertisingConfig()?.let { advertisingConfig = it }
    withMap("adaptationConfig") { adaptationConfig = it.toAdaptationConfig() }
    withMap("remoteControlConfig") { remoteControlConfig = it.toRemoteControlConfig() }
    withMap("bufferConfig") { bufferConfig = it.toBufferConfig() }
    withMap("liveConfig") { liveConfig = it.toLiveConfig() }
    withMap("networkConfig") { networkConfig = it.toNetworkConfig() }
}

/**
 * Converts any JS object into a `BufferMediaTypeConfig` object.
 */
fun Map<String, Any?>.toBufferMediaTypeConfig(): BufferMediaTypeConfig = BufferMediaTypeConfig().apply {
    withDouble("forwardDuration") { forwardDuration = it }
}

/**
 * Converts any JS object into a `BufferConfig` object.
 */
fun Map<String, Any?>.toBufferConfig(): BufferConfig = BufferConfig().apply {
    withMap("audioAndVideo") { audioAndVideo = it.toBufferMediaTypeConfig() }
    withDouble("restartThreshold") { restartThreshold = it }
    withDouble("startupThreshold") { startupThreshold = it }
}

/**
 * Converts an arbitrary [Map] to a [RemoteControlConfig].
 */
private fun Map<String, Any?>.toRemoteControlConfig(): RemoteControlConfig = RemoteControlConfig().apply {
    withString("receiverStylesheetUrl") { receiverStylesheetUrl = it }
    withMap("customReceiverConfig") { customReceiverConfig = it.mapValues { entry -> entry.value as? String } }
    withBoolean("isCastEnabled") { isCastEnabled = it }
    withBoolean("sendManifestRequestsWithCredentials") { sendManifestRequestsWithCredentials = it }
    withBoolean("sendSegmentRequestsWithCredentials") { sendSegmentRequestsWithCredentials = it }
    withBoolean("sendDrmLicenseRequestsWithCredentials") { sendDrmLicenseRequestsWithCredentials = it }
}

/**
 * Converts an arbitrary `json` to `SourceOptions`.
 */
fun Map<String, Any?>.toSourceOptions(): SourceOptions = SourceOptions(
    startOffset = getDoubleOrNull("startOffset"),
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
private fun Map<String, Any?>.toAdaptationConfig(): AdaptationConfig = AdaptationConfig().apply {
    withInt("maxSelectableBitrate") { maxSelectableVideoBitrate = it }
    withInt("initialBandwidthEstimateOverride") { initialBandwidthEstimateOverride = it.toLong(); }
}

/**
 * Converts any JS object into a `PlaybackConfig` object.
 */
fun Map<String, Any?>.toPlaybackConfig(): PlaybackConfig = PlaybackConfig().apply {
    withBoolean("isAutoplayEnabled") { isAutoplayEnabled = it }
    withBoolean("isMuted") { isMuted = it }
    withBoolean("isTimeShiftEnabled") { isTimeShiftEnabled = it }
}

/**
 * Converts any JS object into a `StyleConfig` object.
 */
fun Map<String, Any?>.toStyleConfig(): StyleConfig = StyleConfig().apply {
    withBoolean("isUiEnabled") { isUiEnabled = it }
    getString("playerUiCss")?.takeIf { it.isNotEmpty() }?.let { playerUiCss = it }
    getString("supplementalPlayerUiCss")?.takeIf { it.isNotEmpty() }?.let { supplementalPlayerUiCss = it }
    getString("playerUiJs")?.takeIf { it.isNotEmpty() }?.let { playerUiJs = it }
    withString("scalingMode") { scalingMode = ScalingMode.valueOf(it) }
}

/**
 * Converts any JS string into an `ForceReuseVideoCodecReason` enum value.
 */
private fun String.toForceReuseVideoCodecReason(): ForceReuseVideoCodecReason? = when (this) {
    "ColorInfoMismatch" -> ForceReuseVideoCodecReason.ColorInfoMismatch
    "MaxInputSizeExceeded" -> ForceReuseVideoCodecReason.MaxInputSizeExceeded
    "MaxResolutionExceeded" -> ForceReuseVideoCodecReason.MaxResolutionExceeded
    else -> null
}

/**
 * Converts any JS object into a `TweaksConfig` object.
 */
fun Map<String, Any?>.toTweaksConfig(): TweaksConfig = TweaksConfig().apply {
    withDouble("timeChangedInterval") { timeChangedInterval = it }
    withInt("bandwidthEstimateWeightLimit") {
        bandwidthMeterType = BandwidthMeterType.Default(
            bandwidthEstimateWeightLimit = it,
        )
    }
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
    withStringArray("forceReuseVideoCodecReasons") {
        forceReuseVideoCodecReasons = it
            .filterNotNull()
            .mapNotNull(String::toForceReuseVideoCodecReason)
            .toSet()
    }
}

/**
 * Converts any JS object into an `AdvertisingConfig` object.
 */
fun Map<String, Any?>.toAdvertisingConfig(): AdvertisingConfig? {
    return AdvertisingConfig(
        getArray("schedule")?.toMapList()?.mapNotNull { it?.toAdItem() } ?: return null,
    )
}

/**
 * Converts any JS object into an `AdItem` object.
 */
fun Map<String, Any?>.toAdItem(): AdItem? {
    return AdItem(
        sources = getArray("sources") ?.toMapList()?.mapNotNull { it?.toAdSource() }?.toTypedArray() ?: return null,
        position = getString("position") ?: "pre",
        preloadOffset = getDoubleOrNull("preloadOffset") ?: 0.0,
    )
}

/**
 * Converts any JS object into an `AdSource` object.
 */
fun Map<String, Any?>.toAdSource(): AdSource? {
    return AdSource(
        type = getString("type")?.toAdSourceType() ?: return null,
        tag = getString("tag") ?: return null,
    )
}

/**
 * Converts any JS string into an `AdSourceType` enum value.
 */
private fun String.toAdSourceType(): AdSourceType? = when (this) {
    "bitmovin" -> AdSourceType.Bitmovin
    "ima" -> AdSourceType.Ima
    "progressive" -> AdSourceType.Progressive
    "unknown" -> AdSourceType.Unknown
    else -> null
}

/**
 * Converts an arbitrary `json` to `SourceConfig`.
 */
fun Map<String, Any?>.toSourceConfig(): SourceConfig? {
    val url = getString("url") ?: return null
    val type = getString("type")?.toSourceType() ?: return null
    return SourceConfig(url, type).apply {
        withString("title") { title = it }
        withString("description") { description = it }
        withString("poster") { posterSource = it }
        withBoolean("isPosterPersistent") { isPosterPersistent = it }
        withArray("subtitleTracks") { subtitleTracks ->
            subtitleTracks.toMapList().filterNotNull().forEach { trackMap ->
                trackMap.toSubtitleTrack()?.let {
                    addSubtitleTrack(it)
                }
            }
        }
        withString("thumbnailTrack") { thumbnailTrack = it.toThumbnailTrack() }
        withMap("metadata") { metadata = it.toMap() }
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
fun Source.toJson(): Map<String, Any> = mapOf(
    "duration" to duration,
    "isActive" to isActive,
    "isAttachedToPlayer" to isAttachedToPlayer,
    "loadingState" to loadingState.ordinal,
    "metadata" to (config.metadata ?: emptyMap<String, Any>()),
).filterNotNullValues()

/**
 * Converts any given `SeekPosition` object into its `json` representation.
 */
fun SeekPosition.toJson(): Map<String, Any> = mapOf(
    "time" to time,
    "source" to source.toJson(),
).filterNotNullValues()

/**
 * Converts any given `SourceEvent` object into its `json` representation.
 */
fun SourceEvent.toJson(): Map<String, Any> {
    val baseMap = mutableMapOf<String, Any?>(
        "name" to getName(),
        "timestamp" to timestamp.toDouble(),
    )

    when (this) {
        is SourceEvent.Load -> {
            baseMap["source"] = source.toJson()
        }

        is SourceEvent.Loaded -> {
            baseMap["source"] = source.toJson()
        }

        is SourceEvent.Error -> {
            baseMap["code"] = code.value
            baseMap["message"] = message
        }

        is SourceEvent.Warning -> {
            baseMap["code"] = code.value
            baseMap["message"] = message
        }

        is SourceEvent.AudioTrackAdded -> {
            baseMap["audioTrack"] = audioTrack.toJson()
        }

        is SourceEvent.AudioTrackChanged -> {
            baseMap["oldAudioTrack"] = oldAudioTrack?.toJson()
            baseMap["newAudioTrack"] = newAudioTrack?.toJson()
        }

        is SourceEvent.AudioTrackRemoved -> {
            baseMap["audioTrack"] = audioTrack.toJson()
        }

        is SourceEvent.SubtitleTrackAdded -> {
            baseMap["subtitleTrack"] = subtitleTrack.toJson()
        }

        is SourceEvent.SubtitleTrackRemoved -> {
            baseMap["subtitleTrack"] = subtitleTrack.toJson()
        }

        is SourceEvent.SubtitleTrackChanged -> {
            baseMap["oldSubtitleTrack"] = oldSubtitleTrack?.toJson()
            baseMap["newSubtitleTrack"] = newSubtitleTrack?.toJson()
        }

        is SourceEvent.DownloadFinished -> {
            baseMap["downloadTime"] = downloadTime
            baseMap["requestType"] = downloadType.toString()
            baseMap["httpStatus"] = httpStatus
            baseMap["isSuccess"] = isSuccess
            lastRedirectLocation?.let {
                baseMap["lastRedirectLocation"] = it
            }
            baseMap["size"] = size.toDouble()
            baseMap["url"] = url
        }

        is SourceEvent.VideoDownloadQualityChanged -> {
            baseMap["newVideoQuality"] = newVideoQuality?.toJson()
            baseMap["oldVideoQuality"] = oldVideoQuality?.toJson()
        }

        else -> {
            // Event is not supported yet or does not have any additional data
        }
    }
    return baseMap.filterNotNullValues()
}

/**
 * Converts any given `PlayerEvent` object into its `json` representation.
 */
fun PlayerEvent.toJson(): Map<String, Any> {
    val baseMap = mutableMapOf<String, Any?>(
        "name" to getName(),
        "timestamp" to timestamp.toDouble(),
    )

    when (this) {
        is PlayerEvent.Error -> {
            baseMap["code"] = code.value
            baseMap["message"] = message
        }

        is PlayerEvent.Warning -> {
            baseMap["code"] = code.value
            baseMap["message"] = message
        }

        is PlayerEvent.Play -> {
            baseMap["time"] = time
        }

        is PlayerEvent.Playing -> {
            baseMap["time"] = time
        }

        is PlayerEvent.Paused -> {
            baseMap["time"] = time
        }

        is PlayerEvent.TimeChanged -> {
            baseMap["currentTime"] = time
        }

        is PlayerEvent.Seek -> {
            baseMap["from"] = from.toJson()
            baseMap["to"] = to.toJson()
        }

        is PlayerEvent.TimeShift -> {
            baseMap["position"] = position
            baseMap["targetPosition"] = target
        }

        is PlayerEvent.PictureInPictureAvailabilityChanged -> {
            baseMap["isPictureInPictureAvailable"] = isPictureInPictureAvailable
        }

        is PlayerEvent.AdBreakFinished -> {
            baseMap["adBreak"] = adBreak?.toJson()
        }

        is PlayerEvent.AdBreakStarted -> {
            baseMap["adBreak"] = adBreak?.toJson()
        }

        is PlayerEvent.AdClicked -> {
            baseMap["clickThroughUrl"] = clickThroughUrl
        }

        is PlayerEvent.AdError -> {
            baseMap["code"] = code
            baseMap["message"] = message
            baseMap["adConfig"] = adConfig?.toJson()
            baseMap["adItem"] = adItem?.toJson()
        }

        is PlayerEvent.AdFinished -> {
            baseMap["ad"] = ad?.toJson()
        }

        is PlayerEvent.AdManifestLoad -> {
            baseMap["adBreak"] = adBreak?.toJson()
            baseMap["adConfig"] = adConfig.toJson()
        }

        is PlayerEvent.AdManifestLoaded -> {
            baseMap["adBreak"] = adBreak?.toJson()
            baseMap["adConfig"] = adConfig.toJson()
            baseMap["downloadTime"] = downloadTime.toDouble()
        }

        is PlayerEvent.AdQuartile -> {
            baseMap["quartile"] = quartile.toJson()
        }

        is PlayerEvent.AdScheduled -> {
            baseMap["numberOfAds"] = numberOfAds
        }

        is PlayerEvent.AdSkipped -> {
            baseMap["ad"] = ad?.toJson()
        }

        is PlayerEvent.AdStarted -> {
            baseMap["ad"] = ad?.toJson()
            baseMap["clickThroughUrl"] = clickThroughUrl
            baseMap["clientType"] = clientType?.toJson()
            baseMap["duration"] = duration
            baseMap["indexInQueue"] = indexInQueue
            baseMap["position"] = position
            baseMap["skipOffset"] = skipOffset
            baseMap["timeOffset"] = timeOffset
        }

        is PlayerEvent.VideoPlaybackQualityChanged -> {
            baseMap["newVideoQuality"] = newVideoQuality?.toJson()
            baseMap["oldVideoQuality"] = oldVideoQuality?.toJson()
        }

        is PlayerEvent.CastWaitingForDevice -> {
            baseMap["castPayload"] = castPayload.toJson()
        }

        is PlayerEvent.CastStarted -> {
            baseMap["deviceName"] = deviceName
        }

        is PlayerEvent.CueEnter -> {
            baseMap["start"] = start
            baseMap["end"] = end
            baseMap["text"] = text
            baseMap["image"] = image?.toBase64DataUri()
        }

        is PlayerEvent.CueExit -> {
            baseMap["start"] = start
            baseMap["end"] = end
            baseMap["text"] = text
            baseMap["image"] = image?.toBase64DataUri()
        }

        else -> {
            // Event is not supported yet or does not have any additional data
        }
    }
    return baseMap.filterNotNullValues()
}

/**
 * Converts an arbitrary `json` to `WidevineConfig`.
 */
fun Map<String, Any?>.toWidevineConfig(): WidevineConfig? = getMap("widevine")?.run {
    WidevineConfig(getString("licenseUrl")).apply {
        withString("preferredSecurityLevel") { preferredSecurityLevel = it }
        withBoolean("shouldKeepDrmSessionsAlive") { shouldKeepDrmSessionsAlive = it }
        withMap("httpHeaders") { httpHeaders = it.mapValues { entry -> entry.value as String }.toMutableMap() }
    }
}

/**
 * Converts an `url` string into a `ThumbnailsTrack`.
 */
fun String.toThumbnailTrack(): ThumbnailTrack = ThumbnailTrack(this)

/**
 * Converts any `AudioTrack` into its json representation.
 */
fun AudioTrack.toJson(): Map<String, Any> = mapOf(
    "url" to url,
    "label" to label,
    "isDefault" to isDefault,
    "identifier" to id,
    "language" to language,
    "roles" to roles.map { it.toJson() },
).filterNotNullValues()

/**
 * Converts an arbitrary `json` into a `SubtitleTrack`.
 */
fun Map<String, Any?>.toSubtitleTrack(): SubtitleTrack? {
    return SubtitleTrack(
        url = getString("url") ?: return null,
        label = getString("label") ?: return null,
        id = getString("identifier") ?: UUID.randomUUID().toString(),
        isDefault = getBooleanOrNull("isDefault") ?: false,
        language = getString("language"),
        isForced = getBooleanOrNull("isForced") ?: false,
        mimeType = getString("format")?.takeIf { it.isNotEmpty() }?.toSubtitleMimeType(),
    )
}

/**
 * Converts any subtitle format name in its mime type representation.
 */
private fun String.toSubtitleMimeType(): String = when (this) {
    "srt" -> "application/x-subrip"
    "ttml" -> "application/ttml+xml"
    else -> "text/$this"
}

/**
 * Converts any `SubtitleTrack` into its json representation.
 */
fun SubtitleTrack.toJson(): Map<String, Any> = mapOf(
    "url" to url,
    "label" to label,
    "isDefault" to isDefault,
    "identifier" to id,
    "language" to language,
    "isForced" to isForced,
    "format" to mimeType?.textMimeTypeToJson(),
    "roles" to roles.map { it.toJson() },
).filterNotNullValues()

/**
 * Converts any subtitle track mime type into its json representation (file format value).
 */
private fun String.textMimeTypeToJson(): String = split("/").last()

/**
 * Converts any `AdBreak` object into its json representation.
 */
fun AdBreak.toJson(): Map<String, Any> = mapOf(
    "ads" to ads.map { it.toJson() },
    "id" to id,
    "scheduleTime" to scheduleTime,
)

/**
 * Converts any `Ad` object into its json representation.
 */
fun Ad.toJson(): Map<String, Any> = mapOf(
    "clickThroughUrl" to clickThroughUrl,
    "data" to data?.toJson(),
    "height" to height,
    "id" to id,
    "isLinear" to isLinear,
    "mediaFileUrl" to mediaFileUrl,
    "width" to width,
).filterNotNullValues()

/**
 * Converts any `AdData` object into its json representation.
 */
fun AdData.toJson(): Map<String, Any> = mapOf<String, Any?>(
    "bitrate" to bitrate,
    "maxBitrate" to maxBitrate,
    "mimeType" to mimeType,
    "minBitrate" to minBitrate,
).filterNotNullValues()

/**
 * Converts any `AdConfig` object into its json representation.
 */
fun AdConfig.toJson(): Map<String, Any> = mapOf<String, Any?>(
    "replaceContentDuration" to replaceContentDuration,
).filterNotNullValues()

/**
 * Converts any `AdItem` object into its json representation.
 */
fun AdItem.toJson(): Map<String, Any> = mapOf(
    "position" to position,
    "sources" to sources.toList().map { it.toJson() },
)

/**
 * Converts any `AdSource` object into its json representation.
 */
fun AdSource.toJson(): Map<String, Any> = mapOf(
    "tag" to tag,
    "type" to type.toJson(),
)

/**
 * Converts any `AdSourceType` value into its json representation.
 */
fun AdSourceType.toJson(): String = when (this) {
    AdSourceType.Bitmovin -> "bitmovin"
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
fun Map<String, Any?>.toAnalyticsConfig(): AnalyticsConfig? = getString("licenseKey")
    ?.let { AnalyticsConfig.Builder(it) }
    ?.apply {
        withBoolean("adTrackingDisabled") { setAdTrackingDisabled(it) }
        withBoolean("randomizeUserId") { setRandomizeUserId(it) }
    }?.build()

/**
 * Converts an arbitrary json object into an analytics `DefaultMetadata`.
 */
fun Map<String, Any?>.toAnalyticsDefaultMetadata(): DefaultMetadata = DefaultMetadata.Builder().apply {
    setCustomData(toAnalyticsCustomData())
    withString("cdnProvider") { setCdnProvider(it) }
    withString("customUserId") { setCustomUserId(it) }
}.build()

/**
 * Converts an arbitrary json object into an analytics `CustomData`.
 */
fun Map<String, Any?>.toAnalyticsCustomData(): CustomData = CustomData.Builder().apply {
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
fun CustomData.toJson(): Map<String, Any> {
    val map = mutableMapOf<String, Any?>()
    for (n in 1..30) {
        this[n]?.let { map["customData$n"] = it }
    }
    experimentName?.let { map["experimentName"] = it }
    return map.filterNotNullValues()
}

fun Map<String, Any?>.toAnalyticsSourceMetadata(): SourceMetadata = SourceMetadata(
    title = getString("title"),
    videoId = getString("videoId"),
    cdnProvider = getString("cdnProvider"),
    path = getString("path"),
    isLive = getBooleanOrNull("isLive"),
    customData = toAnalyticsCustomData(),
)

fun SourceMetadata.toJson(): Map<String, Any> {
    val map = customData.toJson().toMutableMap<String, Any?>()
    map["title"] = title
    map["videoId"] = videoId
    map["cdnProvider"] = cdnProvider
    map["path"] = path
    map["isLive"] = isLive
    return map.filterNotNullValues()
}

/**
 * Converts any `VideoQuality` value into its json representation.
 */
fun VideoQuality.toJson(): Map<String, Any> = mapOf<String, Any?>(
    "id" to id,
    "label" to label,
    "bitrate" to bitrate,
    "codec" to codec,
    "frameRate" to frameRate.toDouble(),
    "height" to height,
    "width" to width,
).filterNotNullValues()

/**
 * Converts any `OfflineOptionEntry` into its json representation.
 */
fun OfflineOptionEntry.toJson(): Map<String, Any> = mapOf(
    "id" to id,
    "language" to language,
).filterNotNullValues()

/**
 * Converts any `OfflineContentOptions` into its json representation.
 */
fun OfflineContentOptions.toJson(): Map<String, Any> = mapOf(
    "audioOptions" to audioOptions.map { it.toJson() },
    "textOptions" to textOptions.map { it.toJson() },
)

fun Thumbnail.toJson(): Map<String, Any> = mapOf(
    "start" to start,
    "end" to end,
    "text" to text,
    "url" to uri.toString(),
    "x" to x,
    "y" to y,
    "width" to width,
    "height" to height,
)

fun Map<String, Any?>.toPictureInPictureConfig(): PictureInPictureConfig = PictureInPictureConfig(
    isEnabled = getBooleanOrNull("isEnabled") ?: false,
)

fun Map<String, Any?>.toPlayerViewConfig(): PlayerViewConfig = PlayerViewConfig(
    uiConfig = getMap("uiConfig")?.toUiConfig() ?: UiConfig.WebUi(),
    hideFirstFrame = getBooleanOrNull("hideFirstFrame") ?: false,
    surfaceType = getString("surfaceType")?.toSurfaceType() ?: SurfaceType.SurfaceView,
)

private fun String.toSurfaceType(): SurfaceType? = when (this) {
    "SurfaceView" -> SurfaceType.SurfaceView
    "TextureView" -> SurfaceType.TextureView
    else -> null
}

private fun Map<String, Any?>.toUiConfig(): UiConfig {
    val variant = toVariant() ?: UiConfig.WebUi.Variant.SmallScreenUi
    val focusUiOnInitialization = getBooleanOrNull("focusUiOnInitialization")
    val defaultFocusUiOnInitialization = variant == UiConfig.WebUi.Variant.TvUi

    return UiConfig.WebUi(
        playbackSpeedSelectionEnabled = getBooleanOrNull("playbackSpeedSelectionEnabled") ?: true,
        variant = variant,
        focusUiOnInitialization = focusUiOnInitialization ?: defaultFocusUiOnInitialization,
    )
}

private fun Map<String, Any?>.toVariant(): UiConfig.WebUi.Variant? {
    val uiManagerFactoryFunction = getMap("variant")?.getString("uiManagerFactoryFunction") ?: return null

    return when (uiManagerFactoryFunction) {
        "bitmovin.playerui.UIFactory.buildDefaultSmallScreenUI" -> UiConfig.WebUi.Variant.SmallScreenUi
        "bitmovin.playerui.UIFactory.buildDefaultTvUI" -> UiConfig.WebUi.Variant.TvUi
        else -> UiConfig.WebUi.Variant.Custom(uiManagerFactoryFunction)
    }
}

private fun Map<String, Any?>.toUserInterfaceTypeFromPlayerConfig(): UserInterfaceType? =
    when (getMap("styleConfig")?.getString("userInterfaceType")) {
        "Subtitle" -> UserInterfaceType.Subtitle
        "Bitmovin" -> UserInterfaceType.Bitmovin
        else -> null
    }

fun String.toUserInterfaceType(): UserInterfaceType? = when (this) {
    "Subtitle" -> UserInterfaceType.Subtitle
    "Bitmovin" -> UserInterfaceType.Bitmovin
    else -> null
}

/**
 * Converts the [this@toRNPlayerViewConfigWrapper] to a `RNPlayerViewConfig` object.
 */
fun Map<String, Any?>.toRNPlayerViewConfigWrapper() = RNPlayerViewConfigWrapper(
    playerViewConfig = toPlayerViewConfig(),
    pictureInPictureConfig = getMap("pictureInPictureConfig")?.toPictureInPictureConfig(),
)

fun Map<String, Any?>.toRNStyleConfigWrapperFromPlayerConfig(): RNStyleConfigWrapper? {
    return RNStyleConfigWrapper(
        styleConfig = toStyleConfig(),
        userInterfaceType = toUserInterfaceTypeFromPlayerConfig() ?: return null,
    )
}

/**
 * Converts any JS object into a [LiveConfig] object.
 */
fun Map<String, Any?>.toLiveConfig(): LiveConfig = LiveConfig().apply {
    withDouble("minTimeshiftBufferDepth") { minTimeShiftBufferDepth = it }
}

fun Map<String, Any?>.toHttpRequest(): HttpRequest? {
    return HttpRequest(
        getString("url") ?: return null,
        getMap("headers")?.toMap(),
        getString("body")?.toByteArrayFromBase64(),
        getString("method") ?: return null,
    )
}

private fun ByteArray.toBase64String(): String {
    return Base64.encodeToString(this, Base64.NO_WRAP)
}

private fun String.toByteArrayFromBase64(): ByteArray = Base64.decode(this, Base64.NO_WRAP)

fun Map<String, Any?>.toHttpResponse(): HttpResponse? {
    return HttpResponse(
        httpRequest = getMap("request")?.toHttpRequest() ?: return null,
        url = getString("url") ?: return null,
        status = getInt("status"),
        headers = getMap("headers")?.toMap() ?: return null,
        body = getString("body")?.toByteArrayFromBase64() ?: return null,
    )
}

fun Map<String, Any?>.toNetworkConfig(): NetworkConfig = NetworkConfig()

fun HttpRequest.toJson(): Map<String, Any> = mapOf(
    "url" to url,
    "headers" to headers,
    "body" to body?.toBase64String(),
    "method" to method,
).filterNotNullValues()

fun HttpResponse.toJson(): Map<String, Any> = mapOf(
    "request" to httpRequest.toJson(),
    "url" to url,
    "status" to status,
    "headers" to headers,
    "body" to body.toBase64String(),
)

fun HttpRequestType.toJson(): String = toString()

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

fun BufferLevel.toJson(): Map<String, Any> = mapOf(
    "level" to level,
    "targetLevel" to targetLevel,
    "media" to media.toJson(),
    "type" to type.toJson(),
)

fun RNBufferLevels.toJson(): Map<String, Any> = mapOf(
    "audio" to audio.toJson(),
    "video" to video.toJson(),
)

// Extension function to convert string to BufferType
fun String.toBufferTypeOrThrow(): BufferType = when (this.lowercase()) {
    "forwardduration" -> BufferType.ForwardDuration
    "backwardduration" -> BufferType.BackwardDuration
    else -> throw IllegalArgumentException("Unknown buffer type: $this")
}

/**
 * Maps a JS string into the corresponding [MediaType] value.
 */
fun String.toMediaType(): MediaType? = when (this) {
    "audio" -> MediaType.Audio
    "video" -> MediaType.Video
    else -> null
}

data class MediaControlConfig(
    var isEnabled: Boolean = true,
)

fun Map<String, Any?>.toMediaControlConfig(): MediaControlConfig = MediaControlConfig().apply {
    withBoolean("isEnabled") { isEnabled = it }
}

/**
 * Converts a [CastPayload] object into its JS representation.
 */
private fun CastPayload.toJson(): Map<String, Any> = mapOf<String, Any?>(
    "currentTime" to currentTime,
    "deviceName" to deviceName,
    "type" to type,
).filterNotNullValues()

// Removed WritableMap utility function - no longer needed with Map<String, Any?>

fun DecoderContext.toJson(): Map<String, Any> = mapOf(
    "mediaType" to mediaType.name,
    "isAd" to isAd,
)

fun List<MediaCodecInfo>.toJson(): List<Map<String, Any>> = map { it.toJson() }

fun MediaCodecInfo.toJson(): Map<String, Any> = mapOf(
    "name" to name,
    "isSoftware" to isSoftware,
)

fun List<Any?>.toMediaCodecInfoList(): List<MediaCodecInfo> {
    if (isEmpty()) {
        return emptyList()
    }
    val mediaCodecInfoList = mutableListOf<MediaCodecInfo>()
    forEach { item ->
        val info = (item as? Map<String, Any?>)?.toMediaCodecInfo() ?: return@forEach
        mediaCodecInfoList.add(info)
    }
    return mediaCodecInfoList
}

fun Map<String, Any?>.toMediaCodecInfo(): MediaCodecInfo? {
    val name = getString("name") ?: return null
    val isSoftware = getBooleanOrNull("isSoftware") ?: return null
    return MediaCodecInfo(name, isSoftware)
}

fun MediaTrackRole.toJson(): Map<String, Any> = mapOf(
    "id" to id,
    "schemeIdUri" to schemeIdUri,
    "value" to value,
).filterNotNullValues()
