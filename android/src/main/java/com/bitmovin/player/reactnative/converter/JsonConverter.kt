package com.bitmovin.player.reactnative.converter

import android.graphics.Bitmap
import android.text.Layout
import android.util.Base64
import com.bitmovin.player.api.PlayerConfig
import com.bitmovin.player.api.drm.WidevineConfig
import com.bitmovin.player.api.event.PlayerEvent
import com.bitmovin.player.api.event.SourceEvent
import com.bitmovin.player.api.event.data.SeekPosition
import com.bitmovin.player.api.media.subtitle.Cue
import com.bitmovin.player.api.media.subtitle.SubtitleTrack
import com.bitmovin.player.api.source.Source
import com.bitmovin.player.api.source.SourceConfig
import com.bitmovin.player.api.source.SourceType
import com.bitmovin.player.reactnative.extensions.getName
import com.facebook.react.bridge.*
import java.io.ByteArrayOutputStream
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
            if (event is PlayerEvent.CueEnter) {
                json.putDouble("end", event.end)
                json.putDouble("start", event.start)
                json.putString("html", event.html)
                json.putString("text", event.text)
                event.image?.let {
                    json.putString("image", fromImageBitmap(it))
                }
                json.putMap("cue", fromCue(event.cue))
            }
            if (event is PlayerEvent.CueExit) {
                json.putDouble("end", event.end)
                json.putDouble("start", event.start)
                json.putString("html", event.html)
                json.putString("text", event.text)
                event.image?.let {
                    json.putString("image", fromImageBitmap(it))
                }
                json.putMap("cue", fromCue(event.cue))
            }
            return json
        }

        /**
         * Converts any arbitrary `Cue` into its json representation.
         * @param cue The cue object to be converted.
         * @return The cue json representation.
         */
        @JvmStatic
        fun fromCue(cue: Cue): WritableMap {
            val json = Arguments.createMap()
            json.putDouble("end", cue.end)
            json.putDouble("start", cue.start)
            json.putDouble("size", cue.size.toDouble())
            json.putString("text", cue.text)
            json.putString("html", cue.html)
            cue.image?.let {
                json.putString("image", fromImageBitmap(cue.image))
            }
            json.putString("direction", when (cue.verticalType) {
                Cue.VerticalType.VerticalTypeLeftToRight -> "leftToRight"
                Cue.VerticalType.VerticalTypeRightToLeft -> "rightToLeft"
                else -> "horizontal"
            })
            json.putString("textAlignment", when (cue.textAlignment) {
                Layout.Alignment.ALIGN_CENTER -> "center"
                Layout.Alignment.ALIGN_NORMAL -> "start"
                Layout.Alignment.ALIGN_OPPOSITE -> "end"
                else -> "unset"
            })
            // Line positioning data
            val lineJson = Arguments.createMap()
            lineJson.putDouble("value", cue.line.toDouble())
            lineJson.putString("type", when (cue.lineType) {
                Cue.LineType.LineTypeNumber -> "numeric"
                else -> "auto"
            })
            lineJson.putString("align", when (cue.lineAnchor) {
                Cue.AnchorType.AnchorTypeStart -> "start"
                Cue.AnchorType.AnchorTypeEnd -> "end"
                Cue.AnchorType.AnchorTypeMiddle -> "center"
                else -> "unset"
            })
            json.putMap("line", lineJson)
            // VTT positioning data
            val positionJson = Arguments.createMap()
            positionJson.putDouble("value", cue.fractionalPosition.toDouble())
            positionJson.putString("type", "numeric")
            positionJson.putString("align", when (cue.positionAnchor) {
                Cue.AnchorType.AnchorTypeStart -> "start"
                Cue.AnchorType.AnchorTypeEnd -> "end"
                Cue.AnchorType.AnchorTypeMiddle -> "center"
                else -> "unset"
            })
            json.putMap("vttPosition", positionJson)
            return json
        }

        /**
         * Converts any arbitrary android `Bitmap` image to its RN compatible base64 representation.
         * @param image The image bitmap to convert to base64.
         * @return The base64 png representation of the image.
         */
        @JvmStatic
        fun fromImageBitmap(image: Bitmap): String {
            val output = ByteArrayOutputStream()
            image.compress(Bitmap.CompressFormat.PNG, 100, output)
            val base64 = Base64.encodeToString(output.toByteArray(), Base64.NO_WRAP)
            return "data:image/png;base64,${base64}"
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
    }
}