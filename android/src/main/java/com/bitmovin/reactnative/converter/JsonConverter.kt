package com.bitmovin.reactnative.converter

import com.bitmovin.player.api.PlayerConfig
import com.bitmovin.player.api.source.Source
import com.bitmovin.player.api.source.SourceConfig
import com.bitmovin.player.api.source.SourceType
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.bridge.WritableMap

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
      if (json == null) {
        return null
      }
      return PlayerConfig(key = json.getString("licenseKey"))
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
      val config = SourceConfig(url, JsonConverter.toSourceType(type))
      config.posterSource = json.getString("poster")
      return config
    }

    /**
     * Converts an arbitrary `json` to `SourceType`.
     * @param json JS string representing the `SourceType`.
     * @return The generated `SourceType` if successful or `SourceType.Dash` otherwise.
     */
    @JvmStatic
    fun toSourceType(json: String?): SourceType = when(json) {
      "dash" -> SourceType.Dash
      "hls" -> SourceType.Hls
      "smooth" -> SourceType.Smooth
      "progressive" -> SourceType.Progressive
      else -> SourceType.Dash
    }

    /**
     * Converts any given `Source` object into its `json` representation.
     * @param source Source object to be converted.
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
  }
}