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
import com.bitmovin.player.api.media.audio.AudioTrack
import com.bitmovin.player.api.media.subtitle.SubtitleTrack
import com.bitmovin.player.api.source.Source
import com.bitmovin.player.api.source.SourceConfig
import com.bitmovin.player.api.source.SourceType
import com.bitmovin.player.api.ui.ScalingMode
import com.bitmovin.player.api.ui.StyleConfig
import com.bitmovin.player.reactnative.extensions.getName
import com.bitmovin.player.reactnative.extensions.toList
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
            if (json.hasKey("styleConfig")) {
                toStyleConfig(json.getMap("styleConfig"))?.let {
                    playerConfig.styleConfig = it
                }
            }
            if (json.hasKey("tweaksConfig")) {
                toTweaksConfig(json.getMap("tweaksConfig"))?.let {
                    playerConfig.tweaksConfig = it
                }
            }
            if(json.hasKey("tempAngelAdConfig")) {
                toTempAngelAdConfig(json.getMap("tempAngelAdConfig"))?.let {
                    playerConfig.advertisingConfig = it
                }
            }
            return playerConfig
        }

        @JvmStatic
        fun toTempAngelAdConfig(json: ReadableMap?): AdvertisingConfig? {
            if (json == null) {
                return null
            }
            var adConfig = AdvertisingConfig()
            if (json.hasKey("adSourceUrl")) {
                val adUrl = json.getString("adSourceUrl")
                if (!adUrl.isNullOrEmpty()) {
                    val adSource = AdSource(AdSourceType.Ima, adUrl)
                    val adItem = AdItem(adSource)

                    adConfig = AdvertisingConfig(listOf(adItem))
                }
            }
            return adConfig
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
         * Converts any JS object into a `StyleConfig` object.
         * @param json JS object representing the `StyleConfig`.
         * @return The generated `StyleConfig` if successful, `null` otherwise.
         */
        @JvmStatic
        fun toStyleConfig(json: ReadableMap?): StyleConfig? {
            if (json == null) {
                return null
            }
            val styleConfig = StyleConfig()
            if (json.hasKey("isUiEnabled")) {
                styleConfig.isUiEnabled = json.getBoolean("isUiEnabled")
            }
            if (json.hasKey("playerUiCss")) {
                val playerUiCss = json.getString("playerUiCss")
                if (!playerUiCss.isNullOrEmpty()) {
                    styleConfig.playerUiCss = playerUiCss
                }
            }
            if (json.hasKey("supplementalPlayerUiCss")) {
                val supplementalPlayerUiCss = json.getString("supplementalPlayerUiCss")
                if (!supplementalPlayerUiCss.isNullOrEmpty()) {
                    styleConfig.supplementalPlayerUiCss = supplementalPlayerUiCss
                }
            }
            if (json.hasKey("playerUiJs")) {
                val playerUiJs = json.getString("playerUiJs")
                if (!playerUiJs.isNullOrEmpty()) {
                    styleConfig.playerUiJs = playerUiJs
                }
            }
            if (json.hasKey("scalingMode")) {
                val scalingMode = json.getString("scalingMode")
                if (!scalingMode.isNullOrEmpty()) {
                    styleConfig.scalingMode = ScalingMode.valueOf(scalingMode)
                }
            }
            return styleConfig
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
                tweaksConfig.bandwidthEstimateWeightLimit = json.getInt("bandwidthEstimateWeightLimit")
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
                tweaksConfig.languagePropertyNormalization = json.getBoolean("languagePropertyNormalization")
            }
            if (json.hasKey("localDynamicDashWindowUpdateInterval")) {
                tweaksConfig.localDynamicDashWindowUpdateInterval = json.getDouble("localDynamicDashWindowUpdateInterval")
            }
            if (json.hasKey("shouldApplyTtmlRegionWorkaround")) {
                tweaksConfig.shouldApplyTtmlRegionWorkaround = json.getBoolean("shouldApplyTtmlRegionWorkaround")
            }
            if (json.hasKey("useDrmSessionForClearPeriods")) {
                tweaksConfig.useDrmSessionForClearPeriods = json.getBoolean("useDrmSessionForClearPeriods")
            }
            if (json.hasKey("useDrmSessionForClearSources")) {
                tweaksConfig.useDrmSessionForClearSources = json.getBoolean("useDrmSessionForClearSources")
            }
            if (json.hasKey("useFiletypeExtractorFallbackForHls")) {
                tweaksConfig.useFiletypeExtractorFallbackForHls = json.getBoolean("useFiletypeExtractorFallbackForHls")
            }
            return tweaksConfig
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
            if (event is SourceEvent.AudioTrackAdded) {
                json.putMap("audioTrack", fromAudioTrack(event.audioTrack))
            }
            if (event is SourceEvent.AudioTrackChanged) {
                json.putMap("oldAudioTrack", fromAudioTrack(event.oldAudioTrack))
                json.putMap("newAudioTrack", fromAudioTrack(event.newAudioTrack))
            }
            if (event is SourceEvent.AudioTrackRemoved) {
                json.putMap("audioTrack", fromAudioTrack(event.audioTrack))
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
            if(event is SourceEvent.DurationChanged) {
                json.putDouble("duration", event.to)
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

            // --- Temp Ad Events --- //
            if (event is PlayerEvent.AdStarted) {
                json.putString("clientType", fromAdSourceType(event.clientType))
                json.putString("clickThrougUrl", event.clickThroughUrl)
                json.putInt("indexInQueue", event.indexInQueue)
                json.putDouble("duration", event.duration)
                json.putDouble("timeOffset", event.timeOffset)
                json.putString("position", event.position)
                json.putDouble("skipOffset", event.skipOffset)
                json.putMap("ad", fromAd(event.ad))
            }

            if (event is PlayerEvent.AdFinished) {
                json.putMap("ad", fromAd(event.ad))
            }

            if (event is PlayerEvent.AdQuartile) {
                json.putMap("quartile", fromAdQuartile(event.quartile))
            }

            if (event is PlayerEvent.AdBreakStarted) {
                json.putMap("adBreak", fromAdBreak(event.adBreak))
            }

            if (event is PlayerEvent.AdBreakFinished) {
                json.putMap("adBreak", fromAdBreak(event.adBreak))
            }

            if (event is PlayerEvent.AdScheduled) {
                json.putInt("numberOfAds", event.numberOfAds)
            }

            if (event is PlayerEvent.AdSkipped) {
                json.putMap("ad", fromAd(event.ad))
            }

            if (event is PlayerEvent.AdClicked) {
                json.putString("clickThroughUrl", event.clickThroughUrl)
            }

            if (event is PlayerEvent.AdError) {
                json.putMap("adConfig", fromAdConfig(event.adConfig))
                json.putMap("adItem", fromAdItem(event.adItem))
                json.putInt("code", event.code)
                json.putString("message", event.message)
            }

            if (event is PlayerEvent.AdManifestLoad) {
                json.putMap("adBreak", fromAdBreak(event.adBreak))
                json.putMap("adConfig", fromAdConfig(event.adConfig))
            }

            if (event is PlayerEvent.AdManifestLoaded) {
                json.putMap("adBreak", fromAdBreak(event.adBreak))
                json.putMap("adConfig", fromAdConfig(event.adConfig))
                json.putInt("downloadTime", event.downloadTime.toInt())
            }

            return json
        }

        // --- Temp Ad Converters --- //

        @JvmStatic
        fun fromAdSourceType(adSourceType: AdSourceType?): String? {
            if (adSourceType === null) {
                return null
            }

            return adSourceType.name
        }

        @JvmStatic
        fun fromAd(ad: Ad?): WritableMap? {
            if (ad === null) {
                return null
            }

            val json = Arguments.createMap()
            json.putString("clickThroughUrl", ad.clickThroughUrl)
            json.putMap("data", fromAdData(ad.data))
            json.putInt("height", ad.height)
            json.putInt("width", ad.width)
            json.putString("id", ad.id)
            json.putBoolean("isLinear", ad.isLinear)
            json.putString("mediaFileUrl", ad.mediaFileUrl)
            return json
        }

        @JvmStatic
        fun fromAdData(adData: AdData?): WritableMap? {
            if (adData === null) {
                return null
            }

            val json = Arguments.createMap()
            adData.bitrate?.let { json.putInt("bitrate", it) }
            adData.maxBitrate?.let { json.putInt("maxBitrate", it) }
            adData.minBitrate?.let { json.putInt("minBitrate", it) }
            adData.mimeType?.let { json.putString("mimeType", it) }
            return json
        }

        @JvmStatic
        fun fromAdQuartile(adQuartile: AdQuartile?): WritableMap? {
            if (adQuartile === null) {
                return null
            }

            val json = Arguments.createMap()
            json.putDouble("percentage", adQuartile.percentage)
            return json
        }

        @JvmStatic
        fun fromAdBreak(adBreak: AdBreak?): WritableMap? {
            if (adBreak === null) {
                return null
            }

            val ads = Arguments.createArray()
            adBreak.ads.forEach { ads.pushMap(fromAd(it)) }

            val json = Arguments.createMap()
            json.putArray("ads", ads)
            json.putString("id", adBreak.id)
            json.putDouble("scheduleTime", adBreak.scheduleTime)
            return json
        }

        @JvmStatic
        fun fromAdConfig(adConfig: AdConfig?): WritableMap? {
            if (adConfig === null) {
                return null
            }

            val json = Arguments.createMap()
            adConfig.replaceContentDuration?.let { json.putDouble("replaceContentDuration", it) }
            return json
        }

        @JvmStatic
        fun fromAdSource(adSource: AdSource?): WritableMap? {
            if (adSource === null) {
                return null
            }

            val json = Arguments.createMap()
            json.putString("tag", adSource.tag)
            json.putString("type", fromAdSourceType(adSource.type))
            return json
        }

        @JvmStatic
        fun fromAdItem(adItem: AdItem?): WritableMap? {
            if (adItem === null) {
                return null
            }

            val sources = Arguments.createArray()
            adItem.sources.forEach { sources.pushMap(fromAdSource(it)) }

            val json = Arguments.createMap()
            json.putArray("sources", sources)
            json.putString("position", adItem.position)
            json.putDouble("preloadOffset", adItem.preloadOffset)
            json.putDouble("replaceContentDuration", adItem.replaceContentDuration)
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
         * Converts any `AudioTrack` into its json representation.
         * @param audioTrack `AudioTrack` object to be converted.
         * @return The generated json map.
         */
        @JvmStatic
        fun fromAudioTrack(audioTrack: AudioTrack?): WritableMap? {
            if (audioTrack == null) {
                return null
            }
            val json = Arguments.createMap()
            json.putString("url", audioTrack.url)
            json.putString("label", audioTrack.label)
            json.putBoolean("isDefault", audioTrack.isDefault)
            json.putString("identifier", audioTrack.id)
            json.putString("language", audioTrack.language)
            return json
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
    }
}
