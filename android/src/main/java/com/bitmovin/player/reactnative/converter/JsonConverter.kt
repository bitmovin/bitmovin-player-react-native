package com.bitmovin.player.reactnative.converter

import com.bitmovin.player.api.DeviceDescription.DeviceName
import com.bitmovin.player.api.DeviceDescription.ModelName
import com.bitmovin.player.api.PlaybackConfig
import com.bitmovin.player.api.PlayerConfig
import com.bitmovin.player.api.TweaksConfig
import com.bitmovin.player.api.advertising.*
import com.bitmovin.player.api.drm.WidevineConfig
import com.bitmovin.player.api.event.PlayerEvent
import com.bitmovin.player.api.event.SourceEvent
import com.bitmovin.player.api.event.data.SeekPosition
import com.bitmovin.player.api.media.subtitle.SubtitleTrack
import com.bitmovin.player.api.offline.options.OfflineContentOptions
import com.bitmovin.player.api.offline.options.OfflineOptionEntry
import com.bitmovin.player.api.source.Source
import com.bitmovin.player.api.source.SourceConfig
import com.bitmovin.player.api.source.SourceType
import com.bitmovin.player.reactnative.extensions.getName
import com.bitmovin.player.reactnative.extensions.putInt
import com.bitmovin.player.reactnative.extensions.putDouble
import com.bitmovin.player.reactnative.extensions.toList
import com.bitmovin.player.reactnative.extensions.toReadableArray
import com.facebook.react.bridge.*
import java.util.UUID

/**
 * Helper class to gather all conversion methods between JS -> Native objects.
 */
class JsonConverter {
    companion object {
        /**
         * Converts an arbitrary `json` to `PlayerConfig`.
         * @param json JS object representing the `PlayerConfig`.
         * @return The generated `PlayerConfig` if successful, `null` otherwise.
         */
        @JvmStatic
        fun toPlayerConfig(json: ReadableMap?): PlayerConfig {
            if (json == null) return PlayerConfig()
            val playerConfig = if (json.hasKey("licenseKey")) {
                PlayerConfig(key = json.getString("licenseKey"))
            } else {
                PlayerConfig()
            }
            if (json.hasKey("playbackConfig")) {
                toPlaybackConfig(json.getMap("playbackConfig"))?.let {
                    playerConfig.playbackConfig = it
                }
            }
            if (json.hasKey("tweaksConfig")) {
                toTweaksConfig(json.getMap("tweaksConfig"))?.let {
                    playerConfig.tweaksConfig = it
                }
            }
            if (json.hasKey("advertisingConfig")) {
                toAdvertisingConfig(json.getMap("advertisingConfig"))?.let {
                    playerConfig.advertisingConfig = it
                }
            }
            return playerConfig
        }

        /**
         * Converts any JS object into a `PlaybackConfig` object.
         * @param json JS object representing the `PlaybackConfig`.
         * @return The generated `PlaybackConfig` if successful, `null` otherwise.
         */
        @JvmStatic
        fun toPlaybackConfig(json: ReadableMap?): PlaybackConfig? {
            if (json == null) {
                return null
            }
            val playbackConfig = PlaybackConfig()
            if (json.hasKey("isAutoplayEnabled")) {
                playbackConfig.isAutoplayEnabled = json.getBoolean("isAutoplayEnabled")
            }
            if (json.hasKey("isMuted")) {
                playbackConfig.isMuted = json.getBoolean("isMuted")
            }
            if (json.hasKey("isTimeShiftEnabled")) {
                playbackConfig.isTimeShiftEnabled = json.getBoolean("isTimeShiftEnabled")
            }
            return playbackConfig
        }

        /**
         * Converts any JS object into a `TweaksConfig` object.
         * @param json JS object representing the `TweaksConfig`.
         * @return The generated `TweaksConfig` if successful, `null` otherwise.
         */
        @JvmStatic
        fun toTweaksConfig(json: ReadableMap?): TweaksConfig? {
            if (json == null) {
                return null
            }
            val tweaksConfig = TweaksConfig()
            if (json.hasKey("timeChangedInterval")) {
                tweaksConfig.timeChangedInterval = json.getDouble("timeChangedInterval")
            }
            if (json.hasKey("bandwidthEstimateWeightLimit")) {
                tweaksConfig.bandwidthEstimateWeightLimit =
                    json.getInt("bandwidthEstimateWeightLimit")
            }
            if (json.hasKey("devicesThatRequireSurfaceWorkaround")) {
                val devices = json.getMap("devicesThatRequireSurfaceWorkaround")
                val deviceNames = devices?.getArray("deviceNames")
                    ?.toList<String>()
                    ?.mapNotNull { it }
                    ?.map { DeviceName(it) }
                    ?: emptyList()
                val modelNames = devices?.getArray("modelNames")
                    ?.toList<String>()
                    ?.mapNotNull { it }
                    ?.map { ModelName(it) }
                    ?: emptyList()
                tweaksConfig.devicesThatRequireSurfaceWorkaround = deviceNames + modelNames
            }
            if (json.hasKey("languagePropertyNormalization")) {
                tweaksConfig.languagePropertyNormalization =
                    json.getBoolean("languagePropertyNormalization")
            }
            if (json.hasKey("localDynamicDashWindowUpdateInterval")) {
                tweaksConfig.localDynamicDashWindowUpdateInterval =
                    json.getDouble("localDynamicDashWindowUpdateInterval")
            }
            if (json.hasKey("shouldApplyTtmlRegionWorkaround")) {
                tweaksConfig.shouldApplyTtmlRegionWorkaround =
                    json.getBoolean("shouldApplyTtmlRegionWorkaround")
            }
            if (json.hasKey("useDrmSessionForClearPeriods")) {
                tweaksConfig.useDrmSessionForClearPeriods =
                    json.getBoolean("useDrmSessionForClearPeriods")
            }
            if (json.hasKey("useDrmSessionForClearSources")) {
                tweaksConfig.useDrmSessionForClearSources =
                    json.getBoolean("useDrmSessionForClearSources")
            }
            if (json.hasKey("useFiletypeExtractorFallbackForHls")) {
                tweaksConfig.useFiletypeExtractorFallbackForHls =
                    json.getBoolean("useFiletypeExtractorFallbackForHls")
            }
            return tweaksConfig
        }

        /**
         * Converts any JS object into an `AdvertisingConfig` object.
         * @param json JS object representing the `AdvertisingConfig`.
         * @return The generated `AdvertisingConfig` if successful, `null` otherwise.
         */
        @JvmStatic
        fun toAdvertisingConfig(json: ReadableMap?): AdvertisingConfig? = json?.getArray("schedule")
            ?.toList<ReadableMap>()
            ?.mapNotNull(::toAdItem)
            ?.let { AdvertisingConfig(it) }

        /**
         * Converts any JS object into an `AdItem` object.
         * @param json JS object representing the `AdItem`.
         * @return The generated `AdItem` if successful, `null` otherwise.
         */
        @JvmStatic
        fun toAdItem(json: ReadableMap?): AdItem? {
            val sources = json?.getArray("sources")
                ?.toList<ReadableMap>()
                ?.mapNotNull(::toAdSource)
                ?.toTypedArray()
                ?: return null
            return AdItem(sources, json?.getString("position") ?: "pre")
        }

        /**
         * Converts any JS object into an `AdSource` object.
         * @param json JS object representing the `AdSource`.
         * @return The generated `AdSource` if successful, `null` otherwise.
         */
        @JvmStatic
        fun toAdSource(json: ReadableMap?): AdSource? = json?.getString("tag")?.let {
            AdSource(toAdSourceType(json.getString("type")), it)
        }

        /**
         * Converts any JS string into an `AdSourceType` enum value.
         * @param json JS string representing the `AdSourceType`.
         * @return The generated `AdSourceType`.
         */
        @JvmStatic
        fun toAdSourceType(json: String?): AdSourceType = when (json) {
            "ima" -> AdSourceType.Ima
            "progressive" -> AdSourceType.Progressive
            else -> AdSourceType.Unknown
        }

        /**
         * Converts an arbitrary `json` to `SourceConfig`.
         * @param json JS object representing the `SourceConfig`.
         * @return The generated `SourceConfig` if successful, `null` otherwise.
         */
        @JvmStatic
        fun toSourceConfig(json: ReadableMap?): SourceConfig? {
            val url = json?.getString("url")
            val type = json?.getString("type")
            if (json == null || url == null || type == null) {
                return null
            }
            val config = SourceConfig(url, toSourceType(type))
            config.title = json.getString("title")
            config.posterSource = json.getString("poster")
            if (json.hasKey("isPosterPersistent")) {
                config.isPosterPersistent = json.getBoolean("isPosterPersistent")
            }
            if (json.hasKey("subtitleTracks")) {
                val subtitleTracks = json.getArray("subtitleTracks") as ReadableArray
                for (i in 0 until subtitleTracks.size()) {
                    toSubtitleTrack(subtitleTracks.getMap(i))?.let {
                        config.addSubtitleTrack(it)
                    }
                }
            }
            return config
        }

        /**
         * Converts any given `SourceConfig` object into its `json` representation.
         * @param sourceConfig `SourceConfig` object to be converted.
         * @return The `json` representation of the given `Source`.
         */
        @JvmStatic
        fun toJson(sourceConfig: SourceConfig?): WritableMap? {
            if (sourceConfig == null) {
                return null
            }
            val json = Arguments.createMap()
            json.putString("url", sourceConfig.url)
            json.putString("type", toJson(sourceConfig.type))
            json.putString("title", sourceConfig.title)
            json.putString("poster", sourceConfig.posterSource)
            json.putBoolean("isPosterPersistent", sourceConfig.isPosterPersistent)
            json.putArray("subtitleTracks", sourceConfig.subtitleTracks.map { track ->
                fromSubtitleTrack(track)
            }.toReadableArray())
            json.putNull("metadata")
            return json
        }

        /**
         * Converts an arbitrary `json` to `SourceType`.
         * @param json JS string representing the `SourceType`.
         * @return The generated `SourceType` if successful or `SourceType.Dash` otherwise.
         */
        @JvmStatic
        fun toSourceType(json: String?): SourceType = when (json) {
            "dash" -> SourceType.Dash
            "hls" -> SourceType.Hls
            "smooth" -> SourceType.Smooth
            "progressive" -> SourceType.Progressive
            else -> SourceType.Dash
        }

        /**
         * Converts an arbitrary `SourceType` to it's json representation.
         * @param sourceType The `SourceType` to convert.
         * @return The `json` representation of the given `SourceType`.
         */
        @JvmStatic
        fun toJson(sourceType: SourceType?): String? = when (sourceType) {
            SourceType.Dash -> "dash"
            SourceType.Hls -> "hls"
            SourceType.Smooth -> "smooth"
            SourceType.Progressive -> "progressive"
            else -> null
        }

        /**
         * Converts any given `Source` object into its `json` representation.
         * @param source `Source` object to be converted.
         * @return The `json` representation of the given `Source`.
         */
        @JvmStatic
        fun fromSource(source: Source?): WritableMap? {
            if (source == null) {
                return null
            }
            val json = Arguments.createMap()
            json.putDouble("duration", source.duration)
            json.putBoolean("isActive", source.isActive)
            json.putBoolean("isAttachedToPlayer", source.isAttachedToPlayer)
            json.putInt("loadingState", source.loadingState.ordinal)
            json.putNull("metadata")
            return json
        }

        /**
         * Converts any given `SeekPosition` object into its `json` representation.
         * @param seekPosition `SeekPosition` object to be converted.
         * @return The `json` representation of the given `SeekPosition`.
         */
        @JvmStatic
        fun fromSeekPosition(seekPosition: SeekPosition): WritableMap? {
            val json = Arguments.createMap()
            json.putDouble("time", seekPosition.time)
            json.putMap("source", fromSource(seekPosition.source))
            return json
        }

        /**
         * Converts any given `SourceEvent` object into its `json` representation.
         * @param event `SourceEvent` object to be converted.
         * @return The `json` representation of the given `SourceEvent`.
         */
        @JvmStatic
        fun fromSourceEvent(event: SourceEvent): WritableMap? {
            val json = Arguments.createMap()
            json.putString("name", event.getName())
            json.putDouble("timestamp", event.timestamp.toDouble())
            if (event is SourceEvent.Load) {
                json.putMap("source", fromSource(event.source))
            }
            if (event is SourceEvent.Loaded) {
                json.putMap("source", fromSource(event.source))
            }
            if (event is SourceEvent.Error) {
                json.putInt("code", event.code.value)
                json.putString("message", event.message)
            }
            if (event is SourceEvent.Warning) {
                json.putInt("code", event.code.value)
                json.putString("message", event.message)
            }
            if (event is SourceEvent.SubtitleTrackAdded) {
                json.putMap("subtitleTrack", fromSubtitleTrack(event.subtitleTrack))
            }
            if (event is SourceEvent.SubtitleTrackRemoved) {
                json.putMap("subtitleTrack", fromSubtitleTrack(event.subtitleTrack))
            }
            if (event is SourceEvent.SubtitleTrackChanged) {
                json.putMap("oldSubtitleTrack", fromSubtitleTrack(event.oldSubtitleTrack))
                json.putMap("newSubtitleTrack", fromSubtitleTrack(event.newSubtitleTrack))
            }
            return json
        }

        /**
         * Converts any given `PlayerEvent` object into its `json` representation.
         * @param event `PlayerEvent` object to be converted.
         * @return The `json` representation of given `PlayerEvent`.
         */
        @JvmStatic
        fun fromPlayerEvent(event: PlayerEvent): WritableMap? {
            val json = Arguments.createMap()
            json.putString("name", event.getName())
            json.putDouble("timestamp", event.timestamp.toDouble())
            if (event is PlayerEvent.Error) {
                json.putInt("code", event.code.value)
                json.putString("message", event.message)
            }
            if (event is PlayerEvent.Warning) {
                json.putInt("code", event.code.value)
                json.putString("message", event.message)
            }
            if (event is PlayerEvent.Play) {
                json.putDouble("time", event.time)
            }
            if (event is PlayerEvent.Playing) {
                json.putDouble("time", event.time)
            }
            if (event is PlayerEvent.Paused) {
                json.putDouble("time", event.time)
            }
            if (event is PlayerEvent.TimeChanged) {
                json.putDouble("currentTime", event.time)
            }
            if (event is PlayerEvent.Seek) {
                json.putMap("from", fromSeekPosition(event.from))
                json.putMap("to", fromSeekPosition(event.to))
            }
            if (event is PlayerEvent.PictureInPictureAvailabilityChanged) {
                json.putBoolean("isPictureInPictureAvailable", event.isPictureInPictureAvailable)
            }
            if (event is PlayerEvent.AdBreakFinished) {
                json.putMap("adBreak", fromAdBreak(event.adBreak))
            }
            if (event is PlayerEvent.AdBreakStarted) {
                json.putMap("adBreak", fromAdBreak(event.adBreak))
            }
            if (event is PlayerEvent.AdClicked) {
                json.putString("clickThroughUrl", event.clickThroughUrl)
            }
            if (event is PlayerEvent.AdError) {
                json.putInt("code", event.code)
                json.putString("message", event.message)
                json.putMap("adConfig", fromAdConfig(event.adConfig))
                json.putMap("adItem", fromAdItem(event.adItem))
            }
            if (event is PlayerEvent.AdFinished) {
                json.putMap("ad", fromAd(event.ad))
            }
            if (event is PlayerEvent.AdManifestLoad) {
                json.putMap("adBreak", fromAdBreak(event.adBreak))
                json.putMap("adConfig", fromAdConfig(event.adConfig))
            }
            if (event is PlayerEvent.AdManifestLoaded) {
                json.putMap("adBreak", fromAdBreak(event.adBreak))
                json.putMap("adConfig", fromAdConfig(event.adConfig))
                json.putDouble("downloadTime", event.downloadTime.toDouble())
            }
            if (event is PlayerEvent.AdQuartile) {
                json.putString("quartile", fromAdQuartile(event.quartile))
            }
            if (event is PlayerEvent.AdScheduled) {
                json.putInt("numberOfAds", event.numberOfAds)
            }
            if (event is PlayerEvent.AdSkipped) {
                json.putMap("ad", fromAd(event.ad))
            }
            if (event is PlayerEvent.AdStarted) {
                json.putMap("ad", fromAd(event.ad))
                json.putString("clickThroughUrl", event.clickThroughUrl)
                json.putString("clientType", fromAdSourceType(event.clientType))
                json.putDouble("duration", event.duration)
                json.putInt("indexInQueue", event.indexInQueue)
                json.putString("position", event.position)
                json.putDouble("skipOffset", event.skipOffset)
                json.putDouble("timeOffset", event.timeOffset)
            }
            return json
        }

        /**
         * Converts an arbitrary `json` to `WidevineConfig`.
         * @param json JS object representing the `WidevineConfig`.
         * @return The generated `WidevineConfig` if successful, `null` otherwise.
         */
        @JvmStatic
        fun toWidevineConfig(json: ReadableMap?): WidevineConfig? = json?.getMap("widevine")?.let {
            val widevineConfig = WidevineConfig(it.getString("licenseUrl"))
            if (it.hasKey("preferredSecurityLevel")) {
                widevineConfig.preferredSecurityLevel = it.getString("preferredSecurityLevel")
            }
            widevineConfig
        }

        /**
         * Converts an arbitrary `json` into a `SubtitleTrack`.
         * @param json JS object representing the `SubtitleTrack`.
         * @return The generated `SubtitleTrack` if successful, `null` otherwise.
         */
        @JvmStatic
        fun toSubtitleTrack(json: ReadableMap?): SubtitleTrack? {
            val url = json?.getString("url")
            val label = json?.getString("label")
            if (json == null || url == null || label == null) {
                return null
            }
            val identifier = json.getString("identifier") ?: UUID.randomUUID().toString()
            val isDefault = if (json.hasKey("isDefault")) {
                json.getBoolean("isDefault")
            } else {
                false
            }
            val isForced = if (json.hasKey("isForced")) {
                json.getBoolean("isForced")
            } else {
                false
            }
            val format = json.getString("format")
            if (format != null && format.isNotBlank()) {
                return SubtitleTrack(
                    url = url,
                    label = label,
                    id = identifier,
                    isDefault = isDefault,
                    language = json.getString("language"),
                    isForced = isForced,
                    mimeType = toSubtitleMimeType(format),
                )
            }
            return SubtitleTrack(
                url = url,
                label = label,
                id = identifier,
                isDefault = isDefault,
                language = json.getString("language"),
                isForced = isForced,
            )
        }

        /**
         * Converts any subtitle format name in its mime type representation.
         * @param format The file format string received from JS.
         * @return The subtitle file mime type.
         */
        @JvmStatic
        fun toSubtitleMimeType(format: String?): String? {
            if (format == null) {
                return null
            }
            return "text/${format}"
        }

        /**
         * Converts any `SubtitleTrack` into its json representation.
         * @param subtitleTrack `SubtitleTrack` object to be converted.
         * @return The generated json map.
         */
        @JvmStatic
        fun fromSubtitleTrack(subtitleTrack: SubtitleTrack?): WritableMap? {
            if (subtitleTrack == null) {
                return null
            }
            val json = Arguments.createMap()
            json.putString("url", subtitleTrack.url)
            json.putString("label", subtitleTrack.label)
            json.putBoolean("isDefault", subtitleTrack.isDefault)
            json.putString("identifier", subtitleTrack.id)
            json.putString("language", subtitleTrack.language)
            json.putBoolean("isForced", subtitleTrack.isForced)
            json.putString("format", fromSubtitleMimeType(subtitleTrack.mimeType))
            return json
        }

        /**
         * Converts any subtitle track mime type into its json representation (file format value).
         * @param mimeType `SubtitleTrack` file mime type.
         * @return The extracted file format.
         */
        @JvmStatic
        fun fromSubtitleMimeType(mimeType: String?): String? {
            if (mimeType == null) {
                return null
            }
            return mimeType.split("/").last()
        }

        /**
         * Converts any `AdBreak` object into its json representation.
         * @param adBreak `AdBreak` object.
         * @return The produced JS object.
         */
        @JvmStatic
        fun fromAdBreak(adBreak: AdBreak?): WritableMap? = adBreak?.let {
            Arguments.createMap().apply {
                putArray("ads", it.ads.mapNotNull(::fromAd).toReadableArray())
                putString("id", it.id)
                putDouble("scheduleTime", it.scheduleTime)
            }
        }

        /**
         * Converts any `Ad` object into its json representation.
         * @param ad `Ad` object.
         * @return The produced JS object.
         */
        @JvmStatic
        fun fromAd(ad: Ad?): WritableMap? = ad?.let {
            Arguments.createMap().apply {
                putString("clickThroughUrl", it.clickThroughUrl)
                putMap("data", fromAdData(it.data))
                putInt("height", it.height)
                putString("id", it.id)
                putBoolean("isLinear", it.isLinear)
                putString("mediaFileUrl", it.mediaFileUrl)
                putInt("width", it.width)
            }
        }

        /**
         * Converts any `AdData` object into its json representation.
         * @param adData `AdData` object.
         * @return The produced JS object.
         */
        @JvmStatic
        fun fromAdData(adData: AdData?): WritableMap? = adData?.let {
            Arguments.createMap().apply {
                putInt("bitrate", it.bitrate)
                putInt("maxBitrate", it.maxBitrate)
                putString("mimeType", it.mimeType)
                putInt("minBitrate", it.minBitrate)
            }
        }

        /**
         * Converts any `AdConfig` object into its json representation.
         * @param adConfig `AdConfig` object.
         * @return The produced JS object.
         */
        @JvmStatic
        fun fromAdConfig(adConfig: AdConfig?): WritableMap? = adConfig?.let {
            Arguments.createMap().apply {
                putDouble("replaceContentDuration", it.replaceContentDuration)
            }
        }

        /**
         * Converts any `AdItem` object into its json representation.
         * @param adItem `AdItem` object.
         * @return The produced JS object.
         */
        @JvmStatic
        fun fromAdItem(adItem: AdItem?): WritableMap? = adItem?.let {
            Arguments.createMap().apply {
                putString("position", it.position)
                putArray("sources", it.sources.mapNotNull(::fromAdSource).toReadableArray())
            }
        }

        /**
         * Converts any `AdSource` object into its json representation.
         * @param adSource `AdSource` object.
         * @return The produced JS object.
         */
        @JvmStatic
        fun fromAdSource(adSource: AdSource?): WritableMap? = adSource?.let {
            Arguments.createMap().apply {
                putString("tag", it.tag)
                putString("type", fromAdSourceType(it.type))
            }
        }

        /**
         * Converts any `AdSourceType` value into its json representation.
         * @param adSourceType `AdSourceType` value.
         * @return The produced JS string.
         */
        @JvmStatic
        fun fromAdSourceType(adSourceType: AdSourceType?): String? = when (adSourceType) {
            AdSourceType.Ima -> "ima"
            AdSourceType.Unknown -> "unknown"
            AdSourceType.Progressive -> "progressive"
            else -> null
        }

        /**
         * Converts any `AdQuartile` value into its json representation.
         * @param adQuartile `AdQuartile` value.
         * @return The produced JS string.
         */
        @JvmStatic
        fun fromAdQuartile(adQuartile: AdQuartile?): String? = when (adQuartile) {
            AdQuartile.FirstQuartile -> "first"
            AdQuartile.MidPoint -> "mid_point"
            AdQuartile.ThirdQuartile -> "third"
            else -> null
        }

        /**
         * Converts any `OfflineOptionEntry` into its json representation.
         * @param offlineEntry `OfflineOptionEntry` object to be converted.
         * @return The generated json map.
         */
        @JvmStatic
        fun toJson(offlineEntry: OfflineOptionEntry): WritableMap {
            return Arguments.createMap().apply {
                putString("id", offlineEntry.id)
                putInt("bitrate", offlineEntry.bitrate)
                putString("mimeType", offlineEntry.mimeType)
                putString("codecs", offlineEntry.codecs)
                putString("language", offlineEntry.language)
                putString("state", offlineEntry.state.name)
                putString("action", offlineEntry.action?.name)
            }
        }

        /**
         * Converts any `OfflineContentOptions` into its json representation.
         * @param options `OfflineContentOptions` object to be converted.
         * @return The generated json map.
         */
        @JvmStatic
        fun toJson(options: OfflineContentOptions?): WritableMap? {
            if (options == null) {
                return null
            }

            val videoOptions = Arguments.createArray()
            options.videoOptions.forEach {
                videoOptions.pushMap(toJson(it).apply {
                    putInt("width", it.width)
                    putInt("height", it.height)
                    putDouble("frameRate", it.frameRate.toDouble())
                })
            }

            val audioOptions = Arguments.createArray()
            options.audioOptions.forEach {
                audioOptions.pushMap(toJson(it).apply {
                    putInt("channelCount", it.channelCount)
                    putInt("sampleRate", it.sampleRate)
                })
            }

            val textOptions = Arguments.createArray()
            options.textOptions.forEach {
                textOptions.pushMap(toJson(it))
            }

            var thumbnailOption: WritableMap? = null
            if (options.thumbnailOption != null) {
                thumbnailOption = toJson(options.thumbnailOption!!)
            }

            return Arguments.createMap().apply {
                putArray("videoOptions", videoOptions)
                putArray("audioOptions", audioOptions)
                putArray("textOptions", textOptions)
                putMap("thumbnailOption", thumbnailOption)
            }
        }

    }
}
