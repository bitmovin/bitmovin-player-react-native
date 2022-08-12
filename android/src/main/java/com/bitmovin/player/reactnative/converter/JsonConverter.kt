package com.bitmovin.player.reactnative.converter

import com.bitmovin.player.api.PlayerConfig
import com.bitmovin.player.api.drm.WidevineConfig
import com.bitmovin.player.api.event.PlayerEvent
import com.bitmovin.player.api.event.SourceEvent
import com.bitmovin.player.api.event.data.SeekPosition
import com.bitmovin.player.api.media.subtitle.SubtitleTrack
import com.bitmovin.player.api.source.Source
import com.bitmovin.player.api.source.SourceConfig
import com.bitmovin.player.api.source.SourceType
import com.bitmovin.player.reactnative.extensions.getName
import com.facebook.react.bridge.*

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
        fun toPlayerConfig(json: ReadableMap?): PlayerConfig? {
            if (json != null && json.hasKey("licenseKey")) {
                return PlayerConfig(key = json.getString("licenseKey"))
            }
            return PlayerConfig()
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
            val identifier = json?.getString("identifier")
            if (json == null || url == null || label == null || identifier == null) {
                return null
            }
            val isDefault = if (json.hasKey("isDefault")) {
                json.getBoolean("isDefault")
            } else {
                false
            }
            return SubtitleTrack(
                url = url,
                label = label,
                id = identifier,
                isDefault = isDefault,
                language = json.getString("language")
            )
        }
    }
}
