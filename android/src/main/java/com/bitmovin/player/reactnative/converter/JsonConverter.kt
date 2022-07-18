package com.bitmovin.player.reactnative.converter

import com.bitmovin.player.api.PlaybackConfig
import com.bitmovin.player.api.PlayerConfig
import com.bitmovin.player.api.event.PlayerEvent
import com.bitmovin.player.api.event.SourceEvent
import com.bitmovin.player.api.event.data.SeekPosition
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
         * Converts an arbitrary `json` to `PlaybackConfig`.
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
            return playbackConfig
        }
    }
}
