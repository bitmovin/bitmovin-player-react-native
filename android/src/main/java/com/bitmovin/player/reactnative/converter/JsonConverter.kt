package com.bitmovin.player.reactnative.converter

import com.bitmovin.analytics.api.AnalyticsConfig
import com.bitmovin.analytics.api.CustomData
import com.bitmovin.analytics.api.DefaultMetadata
import com.bitmovin.analytics.api.SourceMetadata
import com.bitmovin.player.api.DeviceDescription.DeviceName
import com.bitmovin.player.api.DeviceDescription.ModelName
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
import com.bitmovin.player.api.buffer.BufferMediaTypeConfig
import com.bitmovin.player.api.casting.RemoteControlConfig
import com.bitmovin.player.api.drm.WidevineConfig
import com.bitmovin.player.api.event.PlayerEvent
import com.bitmovin.player.api.event.SourceEvent
import com.bitmovin.player.api.event.data.CastPayload
import com.bitmovin.player.api.event.data.SeekPosition
import com.bitmovin.player.api.live.LiveConfig
import com.bitmovin.player.api.media.AdaptationConfig
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
import com.bitmovin.player.reactnative.RNPlayerViewConfigWrapper
import com.bitmovin.player.reactnative.extensions.getBooleanOrNull
import com.bitmovin.player.reactnative.extensions.getName
import com.bitmovin.player.reactnative.extensions.getOrDefault
import com.bitmovin.player.reactnative.extensions.getProperty
import com.bitmovin.player.reactnative.extensions.putBoolean
import com.bitmovin.player.reactnative.extensions.putDouble
import com.bitmovin.player.reactnative.extensions.putInt
import com.bitmovin.player.reactnative.extensions.setProperty
import com.bitmovin.player.reactnative.extensions.toList
import com.bitmovin.player.reactnative.extensions.toReadableArray
import com.bitmovin.player.reactnative.extensions.toReadableMap
import com.bitmovin.player.reactnative.ui.RNPictureInPictureHandler
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.ReadableArray
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.bridge.WritableMap
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
            if (json.hasKey("advertisingConfig")) {
                toAdvertisingConfig(json.getMap("advertisingConfig"))?.let {
                    playerConfig.advertisingConfig = it
                }
            }
            if (json.hasKey("adaptationConfig")) {
                toAdaptationConfig(json.getMap("adaptationConfig"))?.let {
                    playerConfig.adaptationConfig = it
                }
            }
            if (json.hasKey("remoteControlConfig")) {
                toRemoteControlConfig(json.getMap("remoteControlConfig"))?.let {
                    playerConfig.remoteControlConfig = it
                }
            }
            if (json.hasKey("bufferConfig")) {
                toBufferConfig(json.getMap("bufferConfig"))?.let {
                    playerConfig.bufferConfig = it
                }
            }
            if (json.hasKey("liveConfig")) {
                toLiveConfig(json.getMap("liveConfig"))?.let {
                    playerConfig.liveConfig = it
                }
            }
            return playerConfig
        }

        /**
         * Converts any JS object into a `BufferMediaTypeConfig` object.
         * @param json JS object representing the `BufferMediaTypeConfig`.
         * @return The generated `BufferMediaTypeConfig` if successful, `null` otherwise.
         */
        @JvmStatic
        fun toBufferMediaTypeConfig(json: ReadableMap?): BufferMediaTypeConfig? {
            if (json == null) {
                return null
            }
            val bufferMediaTypeConfig = BufferMediaTypeConfig()
            if (json.hasKey("forwardDuration")) {
                bufferMediaTypeConfig.forwardDuration = json.getDouble("forwardDuration")
            }
            return bufferMediaTypeConfig
        }

        /**
         * Converts any JS object into a `BufferConfig` object.
         * @param json JS object representing the `BufferConfig`.
         * @return The generated `BufferConfig` if successful, `null` otherwise.
         */
        @JvmStatic
        fun toBufferConfig(json: ReadableMap?): BufferConfig? {
            if (json == null) {
                return null
            }
            val bufferConfig = BufferConfig()
            if (json.hasKey("audioAndVideo")) {
                toBufferMediaTypeConfig(json.getMap("audioAndVideo"))?.let {
                    bufferConfig.audioAndVideo = it
                }
            }
            if (json.hasKey("restartThreshold")) {
                bufferConfig.restartThreshold = json.getDouble("restartThreshold")
            }
            if (json.hasKey("startupThreshold")) {
                bufferConfig.startupThreshold = json.getDouble("startupThreshold")
            }
            return bufferConfig
        }

        /**
         * Converts an arbitrary [ReadableMap] to a [RemoteControlConfig].
         *
         * @param json JS object representing the [RemoteControlConfig].
         * @return The generated [RemoteControlConfig].
         */
        private fun toRemoteControlConfig(json: ReadableMap?): RemoteControlConfig? {
            if (json == null) return null
            val defaultRemoteControlConfig = RemoteControlConfig()

            val receiverStylesheetUrl = json.getOrDefault(
                "receiverStylesheetUrl",
                defaultRemoteControlConfig.receiverStylesheetUrl,
            )

            var customReceiverConfig = defaultRemoteControlConfig.customReceiverConfig
            if (json.hasKey("customReceiverConfig")) {
                customReceiverConfig = json.getMap("customReceiverConfig")
                    ?.toHashMap()
                    ?.mapValues { entry -> entry.value as String } ?: emptyMap()
            }

            val isCastEnabled = json.getOrDefault(
                "isCastEnabled",
                defaultRemoteControlConfig.isCastEnabled,
            )

            val sendManifestRequestsWithCredentials = json.getOrDefault(
                "sendManifestRequestsWithCredentials",
                defaultRemoteControlConfig.sendManifestRequestsWithCredentials,
            )

            val sendSegmentRequestsWithCredentials = json.getOrDefault(
                "sendSegmentRequestsWithCredentials",
                defaultRemoteControlConfig.sendSegmentRequestsWithCredentials,
            )

            val sendDrmLicenseRequestsWithCredentials = json.getOrDefault(
                "sendDrmLicenseRequestsWithCredentials",
                defaultRemoteControlConfig.sendDrmLicenseRequestsWithCredentials,
            )

            return RemoteControlConfig(
                receiverStylesheetUrl = receiverStylesheetUrl,
                customReceiverConfig = customReceiverConfig,
                isCastEnabled = isCastEnabled,
                sendManifestRequestsWithCredentials = sendManifestRequestsWithCredentials,
                sendSegmentRequestsWithCredentials = sendSegmentRequestsWithCredentials,
                sendDrmLicenseRequestsWithCredentials = sendDrmLicenseRequestsWithCredentials,
            )
        }

        /**
         * Converts an arbitrary `json` to `SourceOptions`.
         * @param json JS object representing the `SourceOptions`.
         * @return The generated `SourceOptions`.
         */
        @JvmStatic
        fun toSourceOptions(json: ReadableMap?): SourceOptions {
            if (json == null) return SourceOptions()
            val startOffset = if (json.hasKey("startOffset")) json.getDouble("startOffset") else null
            val timelineReferencePoint = toTimelineReferencePoint(json.getString("startOffsetTimelineReference"))
            return SourceOptions(startOffset = startOffset, startOffsetTimelineReference = timelineReferencePoint)
        }

        /**
         * Converts an arbitrary `json` to `TimelineReferencePoint`.
         * @param json JS string representing the `TimelineReferencePoint`.
         * @return The generated `TimelineReferencePoint`.
         */
        @JvmStatic
        private fun toTimelineReferencePoint(json: String?): TimelineReferencePoint? = when (json) {
            "start" -> TimelineReferencePoint.Start
            "end" -> TimelineReferencePoint.End
            else -> null
        }

        /**
         * Converts an arbitrary `json` to `AdaptationConfig`.
         * @param json JS object representing the `AdaptationConfig`.
         * @return The generated `AdaptationConfig` if successful, `null` otherwise.
         */
        private fun toAdaptationConfig(json: ReadableMap?): AdaptationConfig? {
            if (json == null) return null
            val adaptationConfig = AdaptationConfig()
            if (json.hasKey("maxSelectableBitrate")) {
                adaptationConfig.maxSelectableVideoBitrate = json.getInt("maxSelectableBitrate")
            }
            return adaptationConfig
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
                tweaksConfig.localDynamicDashWindowUpdateInterval = json.getDouble(
                    "localDynamicDashWindowUpdateInterval",
                )
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
            return AdItem(sources, json.getString("position") ?: "pre")
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
            config.description = json.getString("description")
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
            if (json.hasKey("thumbnailTrack")) {
                config.thumbnailTrack = toThumbnailTrack(json.getString("thumbnailTrack"))
            }
            if (json.hasKey("metadata")) {
                config.metadata = json.getMap("metadata")
                    ?.toHashMap()
                    ?.mapValues { entry -> entry.value as String }
            }
            if (json.hasKey("options")) {
                config.options = toSourceOptions(json.getMap("options"))
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
            json.putMap("metadata", source.config.metadata?.toReadableMap())
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
            when (event) {
                is SourceEvent.Load -> {
                    json.putMap("source", fromSource(event.source))
                }

                is SourceEvent.Loaded -> {
                    json.putMap("source", fromSource(event.source))
                }

                is SourceEvent.Error -> {
                    json.putInt("code", event.code.value)
                    json.putString("message", event.message)
                }

                is SourceEvent.Warning -> {
                    json.putInt("code", event.code.value)
                    json.putString("message", event.message)
                }

                is SourceEvent.AudioTrackAdded -> {
                    json.putMap("audioTrack", fromAudioTrack(event.audioTrack))
                }

                is SourceEvent.AudioTrackChanged -> {
                    json.putMap("oldAudioTrack", fromAudioTrack(event.oldAudioTrack))
                    json.putMap("newAudioTrack", fromAudioTrack(event.newAudioTrack))
                }

                is SourceEvent.AudioTrackRemoved -> {
                    json.putMap("audioTrack", fromAudioTrack(event.audioTrack))
                }

                is SourceEvent.SubtitleTrackAdded -> {
                    json.putMap("subtitleTrack", fromSubtitleTrack(event.subtitleTrack))
                }

                is SourceEvent.SubtitleTrackRemoved -> {
                    json.putMap("subtitleTrack", fromSubtitleTrack(event.subtitleTrack))
                }

                is SourceEvent.SubtitleTrackChanged -> {
                    json.putMap("oldSubtitleTrack", fromSubtitleTrack(event.oldSubtitleTrack))
                    json.putMap("newSubtitleTrack", fromSubtitleTrack(event.newSubtitleTrack))
                }

                else -> {
                    // Event is not supported yet or does not have any additional data
                }
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
            when (event) {
                is PlayerEvent.Error -> {
                    json.putInt("code", event.code.value)
                    json.putString("message", event.message)
                }

                is PlayerEvent.Warning -> {
                    json.putInt("code", event.code.value)
                    json.putString("message", event.message)
                }

                is PlayerEvent.Play -> {
                    json.putDouble("time", event.time)
                }

                is PlayerEvent.Playing -> {
                    json.putDouble("time", event.time)
                }

                is PlayerEvent.Paused -> {
                    json.putDouble("time", event.time)
                }

                is PlayerEvent.TimeChanged -> {
                    json.putDouble("currentTime", event.time)
                }

                is PlayerEvent.Seek -> {
                    json.putMap("from", fromSeekPosition(event.from))
                    json.putMap("to", fromSeekPosition(event.to))
                }

                is PlayerEvent.TimeShift -> {
                    json.putDouble("position", event.position)
                    json.putDouble("targetPosition", event.target)
                }

                is PlayerEvent.PictureInPictureAvailabilityChanged -> {
                    json.putBoolean("isPictureInPictureAvailable", event.isPictureInPictureAvailable)
                }

                is PlayerEvent.AdBreakFinished -> {
                    json.putMap("adBreak", fromAdBreak(event.adBreak))
                }

                is PlayerEvent.AdBreakStarted -> {
                    json.putMap("adBreak", fromAdBreak(event.adBreak))
                }

                is PlayerEvent.AdClicked -> {
                    json.putString("clickThroughUrl", event.clickThroughUrl)
                }

                is PlayerEvent.AdError -> {
                    json.putInt("code", event.code)
                    json.putString("message", event.message)
                    json.putMap("adConfig", fromAdConfig(event.adConfig))
                    json.putMap("adItem", fromAdItem(event.adItem))
                }

                is PlayerEvent.AdFinished -> {
                    json.putMap("ad", fromAd(event.ad))
                }

                is PlayerEvent.AdManifestLoad -> {
                    json.putMap("adBreak", fromAdBreak(event.adBreak))
                    json.putMap("adConfig", fromAdConfig(event.adConfig))
                }

                is PlayerEvent.AdManifestLoaded -> {
                    json.putMap("adBreak", fromAdBreak(event.adBreak))
                    json.putMap("adConfig", fromAdConfig(event.adConfig))
                    json.putDouble("downloadTime", event.downloadTime.toDouble())
                }

                is PlayerEvent.AdQuartile -> {
                    json.putString("quartile", fromAdQuartile(event.quartile))
                }

                is PlayerEvent.AdScheduled -> {
                    json.putInt("numberOfAds", event.numberOfAds)
                }

                is PlayerEvent.AdSkipped -> {
                    json.putMap("ad", fromAd(event.ad))
                }

                is PlayerEvent.AdStarted -> {
                    json.putMap("ad", fromAd(event.ad))
                    json.putString("clickThroughUrl", event.clickThroughUrl)
                    json.putString("clientType", fromAdSourceType(event.clientType))
                    json.putDouble("duration", event.duration)
                    json.putInt("indexInQueue", event.indexInQueue)
                    json.putString("position", event.position)
                    json.putDouble("skipOffset", event.skipOffset)
                    json.putDouble("timeOffset", event.timeOffset)
                }

                is PlayerEvent.VideoPlaybackQualityChanged -> {
                    json.putMap("newVideoQuality", fromVideoQuality(event.newVideoQuality))
                    json.putMap("oldVideoQuality", fromVideoQuality(event.oldVideoQuality))
                }

                is PlayerEvent.CastWaitingForDevice -> {
                    json.putMap("castPayload", fromCastPayload(event.castPayload))
                }

                is PlayerEvent.CastStarted -> {
                    json.putString("deviceName", event.deviceName)
                }

                else -> {
                    // Event is not supported yet or does not have any additional data
                }
            }
            return json
        }

        /**
         * Converts an arbitrary `json` into [BitmovinCastManagerOptions].
         * @param json JS object representing the [BitmovinCastManagerOptions].
         * @return The generated [BitmovinCastManagerOptions] if successful, `null` otherwise.
         */
        fun toCastOptions(json: ReadableMap?): BitmovinCastManagerOptions? {
            if (json == null) return null
            return BitmovinCastManagerOptions(
                json.getOrDefault("applicationId", null),
                json.getOrDefault("messageNamespace", null),
            )
        }

        /**
         * Converts an arbitrary `json` to `WidevineConfig`.
         * @param json JS object representing the `WidevineConfig`.
         * @return The generated `WidevineConfig` if successful, `null` otherwise.
         */
        @JvmStatic
        fun toWidevineConfig(json: ReadableMap?): WidevineConfig? = json
            ?.getMap("widevine")
            ?.let {
                WidevineConfig(it.getString("licenseUrl"))
                    .apply {
                        if (it.hasKey("preferredSecurityLevel")) {
                            preferredSecurityLevel = it.getString("preferredSecurityLevel")
                        }
                        if (it.hasKey("shouldKeepDrmSessionsAlive")) {
                            shouldKeepDrmSessionsAlive = it.getBoolean("shouldKeepDrmSessionsAlive")
                        }
                        if (it.hasKey("httpHeaders")) {
                            httpHeaders = it.getMap("httpHeaders")
                                ?.toHashMap()
                                ?.mapValues { entry -> entry.value as String }
                                ?.toMutableMap()
                        }
                    }
            }

        /**
         * Converts an `url` string into a `ThumbnailsTrack`.
         * @param url JS object representing the `ThumbnailsTrack`.
         * @return The generated `ThumbnailsTrack` if successful, `null` otherwise.
         */
        @JvmStatic
        fun toThumbnailTrack(url: String?): ThumbnailTrack? {
            if (url == null) {
                return null
            }
            return ThumbnailTrack(url)
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
            if (!format.isNullOrBlank()) {
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
            return "text/$format"
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
         * Converts an arbitrary json object into a `BitmovinAnalyticsConfig`.
         * @param json JS object representing the `BitmovinAnalyticsConfig`.
         * @return The produced `BitmovinAnalyticsConfig` or null.
         */
        @JvmStatic
        fun toAnalyticsConfig(json: ReadableMap?): AnalyticsConfig? = json?.let {
            val licenseKey = it.getString("licenseKey") ?: return null

            return AnalyticsConfig.Builder(licenseKey).apply {
                it.getBooleanOrNull("adTrackingDisabled")?.let { adTrackingDisabled ->
                    setAdTrackingDisabled(adTrackingDisabled)
                }
                it.getBooleanOrNull("randomizeUserId")?.let { randomizeUserId ->
                    setRandomizeUserId(randomizeUserId)
                }
            }.build()
        }

        /**
         * Converts an arbitrary json object into an analytics `DefaultMetadata`.
         * @param json JS object representing the `CustomData`.
         * @return The produced `CustomData` or null.
         */
        @JvmStatic
        fun toAnalyticsDefaultMetadata(json: ReadableMap?): DefaultMetadata? {
            if (json == null) return null

            return DefaultMetadata.Builder().apply {
                toAnalyticsCustomData(json)?.let {
                    setCustomData(it)
                }
                json.getString("cdnProvider")?.let { cdnProvider ->
                    setCdnProvider(cdnProvider)
                }
                json.getString("customUserId")?.let { customUserId ->
                    setCustomUserId(customUserId)
                }
            }.build()
        }

        /**
         * Converts an arbitrary json object into an analytics `CustomData`.
         * @param json JS object representing the `CustomData`.
         * @return The produced `CustomData` or null.
         */
        @JvmStatic
        fun toAnalyticsCustomData(json: ReadableMap?): CustomData? {
            if (json == null) return null

            return CustomData.Builder().apply {
                for (n in 1..30) {
                    setProperty(
                        "customData$n",
                        json.getString("customData$n") ?: continue,
                    )
                }
                json.getString("experimentName")?.let {
                    setExperimentName(it)
                }
            }.build()
        }

        /**
         * Converts an arbitrary analytics `CustomData` object into a JS value.
         * @param customData `CustomData` to be converted.
         * @return The produced JS value or null.
         */
        @JvmStatic
        fun fromAnalyticsCustomData(customData: CustomData?): WritableMap? = customData?.let {
            val json = Arguments.createMap()
            for (n in 1..30) {
                it.getProperty<String>("customData$n")?.let { customDataN ->
                    json.putString("customData$n", customDataN)
                }
            }
            it.experimentName?.let { experimentName ->
                json.putString("experimentName", experimentName)
            }
            json
        }

        @JvmStatic
        fun toAnalyticsSourceMetadata(json: ReadableMap?): SourceMetadata? = json?.let {
            val sourceCustomData = toAnalyticsCustomData(json) ?: CustomData()
            SourceMetadata(
                title = it.getString("title"),
                videoId = it.getString("videoId"),
                cdnProvider = it.getString("cdnProvider"),
                path = it.getString("path"),
                isLive = it.getBoolean("isLive"),
                customData = sourceCustomData,
            )
        }

        @JvmStatic
        fun fromAnalyticsSourceMetadata(sourceMetadata: SourceMetadata?): ReadableMap? {
            if (sourceMetadata == null) return null

            return fromAnalyticsCustomData(sourceMetadata.customData)?.apply {
                putString("title", sourceMetadata.title)
                putString("videoId", sourceMetadata.videoId)
                putString("cdnProvider", sourceMetadata.cdnProvider)
                putString("path", sourceMetadata.path)
                putBoolean("isLive", sourceMetadata.isLive)
            }
        }

        /**
         * Converts any `VideoQuality` value into its json representation.
         * @param videoQuality `VideoQuality` value.
         * @return The produced JS string.
         */
        @JvmStatic
        fun fromVideoQuality(videoQuality: VideoQuality?): WritableMap? = videoQuality?.let {
            Arguments.createMap().apply {
                putString("id", videoQuality.id)
                putString("label", videoQuality.label)
                putInt("bitrate", videoQuality.bitrate)
                putString("codec", videoQuality.codec)
                putDouble("frameRate", videoQuality.frameRate.toDouble())
                putInt("height", videoQuality.height)
                putInt("width", videoQuality.width)
            }
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
                putString("language", offlineEntry.language)
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

            return Arguments.createMap().apply {
                putArray("audioOptions", options.audioOptions.map { toJson(it) }.toReadableArray())
                putArray("textOptions", options.textOptions.map { toJson(it) }.toReadableArray())
            }
        }

        @JvmStatic
        fun fromThumbnail(thumbnail: Thumbnail?): WritableMap? {
            if (thumbnail == null) {
                return null
            }

            return Arguments.createMap().apply {
                putDouble("start", thumbnail.start)
                putDouble("end", thumbnail.end)
                putString("text", thumbnail.text)
                putString("url", thumbnail.uri.toString())
                putInt("x", thumbnail.x)
                putInt("y", thumbnail.y)
                putInt("width", thumbnail.width)
                putInt("height", thumbnail.height)
            }
        }

        @JvmStatic
        fun toPictureInPictureConfig(json: ReadableMap?): RNPictureInPictureHandler.PictureInPictureConfig? =
            json?.let {
                RNPictureInPictureHandler.PictureInPictureConfig(
                    isEnabled = it.getBoolean("isEnabled"),
                )
            }

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
         * Converts the [json] to a `RNPlayerViewConfig` object.
         */
        fun toRNPlayerViewConfigWrapper(json: ReadableMap) = RNPlayerViewConfigWrapper(
            playerViewConfig = toPlayerViewConfig(json),
            pictureInPictureConfig = toPictureInPictureConfig(json.getMap("pictureInPictureConfig")),
        )

        /**
         * Converts any JS object into a [LiveConfig] object.
         * @param json JS object representing the [LiveConfig].
         * @return The generated [LiveConfig] if successful, `null` otherwise.
         */
        @JvmStatic
        fun toLiveConfig(json: ReadableMap?): LiveConfig? {
            if (json == null) {
                return null
            }
            val liveConfig = LiveConfig()
            if (json.hasKey("minTimeshiftBufferDepth")) {
                liveConfig.minTimeShiftBufferDepth = json.getDouble("minTimeshiftBufferDepth")
            }
            return liveConfig
        }
    }
}

/**
 * Converts a [CastPayload] object into its JS representation.
 */
private fun fromCastPayload(castPayload: CastPayload) = Arguments.createMap().apply {
    putDouble("currentTime", castPayload.currentTime)
    putString("deviceName", castPayload.deviceName)
    putString("type", castPayload.type)
}
