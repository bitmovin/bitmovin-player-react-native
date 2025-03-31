package com.bitmovin.player.reactnative

import android.util.Log
import com.bitmovin.analytics.api.DefaultMetadata
import com.bitmovin.player.api.Player
import com.bitmovin.player.api.PlayerConfig
import com.bitmovin.player.api.analytics.create
import com.bitmovin.player.api.event.PlayerEvent
import com.bitmovin.player.reactnative.converter.toAdItem
import com.bitmovin.player.reactnative.converter.toAnalyticsConfig
import com.bitmovin.player.reactnative.converter.toAnalyticsDefaultMetadata
import com.bitmovin.player.reactnative.converter.toJson
import com.bitmovin.player.reactnative.converter.toMediaControlConfig
import com.bitmovin.player.reactnative.converter.toPlayerConfig
import com.bitmovin.player.reactnative.extensions.mapToReactArray
import com.facebook.react.bridge.*
import com.facebook.react.module.annotations.ReactModule
import java.security.InvalidParameterException

private const val MODULE_NAME = "PlayerModule"

@ReactModule(name = MODULE_NAME)
class PlayerModule(context: ReactApplicationContext) : BitmovinBaseModule(context) {
    /**
     * In-memory mapping from [NativeId]s to [Player] instances.
     */
    private val players: Registry<Player> = mutableMapOf()

    val mediaSessionPlaybackManager = MediaSessionPlaybackManager(context)

    /**
     * JS exported module name.
     */
    override fun getName() = MODULE_NAME

    /**
     * Fetches the `Player` instance associated with [nativeId] from the internal players.
     */
    fun getPlayerOrNull(nativeId: NativeId): Player? = players[nativeId]

    /**
     * Creates a new `Player` instance inside the internal players using the provided `config` object.
     * @param config `PlayerConfig` object received from JS.
     */
    @ReactMethod
    fun initWithConfig(
        nativeId: NativeId,
        config: ReadableMap?,
        networkNativeId: NativeId?,
        decoderNativeId: NativeId?,
        promise: Promise,
    ) {
        init(
            nativeId,
            config,
            networkNativeId = networkNativeId,
            decoderNativeId = decoderNativeId,
            analyticsConfigJson = null,
            promise,
        )
    }

    /**
     * Creates a new `Player` instance inside the internal players using the provided `playerConfig` and `analyticsConfig`.
     * @param playerConfigJson `PlayerConfig` object received from JS.
     * @param analyticsConfigJson `AnalyticsConfig` object received from JS.
     */
    @ReactMethod
    fun initWithAnalyticsConfig(
        nativeId: NativeId,
        playerConfigJson: ReadableMap?,
        networkNativeId: NativeId?,
        decoderNativeId: NativeId?,
        analyticsConfigJson: ReadableMap,
        promise: Promise,
    ) = init(
        nativeId,
        playerConfigJson,
        networkNativeId,
        decoderNativeId,
        analyticsConfigJson,
        promise,
    )

    private fun init(
        nativeId: NativeId,
        playerConfigJson: ReadableMap?,
        networkNativeId: NativeId?,
        decoderNativeId: NativeId?,
        analyticsConfigJson: ReadableMap?,
        promise: Promise,
    ) = promise.unit.resolveOnUiThread {
        if (players.containsKey(nativeId)) {
            if (playerConfigJson != null || analyticsConfigJson != null) {
                Log.w("BitmovinPlayerModule", "Cannot reconfigure an existing player")
            }
            return@resolveOnUiThread // key can be reused to access the same native instance (see NativeInstanceConfig)
        }
        val playerConfig = playerConfigJson?.toPlayerConfig() ?: PlayerConfig()
        val analyticsConfig = analyticsConfigJson?.toAnalyticsConfig()
        val defaultMetadata = analyticsConfigJson?.getMap("defaultMetadata")?.toAnalyticsDefaultMetadata()
        val enableMediaSession = playerConfigJson?.getMap("mediaControlConfig")
            ?.toMediaControlConfig()?.isEnabled ?: true

        val networkConfig = networkNativeId?.let { networkModule.getConfig(it) }
        if (networkConfig != null) {
            playerConfig.networkConfig = networkConfig
        }

        val decoderConfig = decoderNativeId?.let { decoderConfigModule.getConfig(it) }
        if (decoderConfig != null) {
            playerConfig.playbackConfig = playerConfig.playbackConfig.copy(decoderConfig = decoderConfig)
        }

        players[nativeId] = if (analyticsConfig == null) {
            Player.create(context, playerConfig)
        } else {
            Player.create(
                context = context,
                playerConfig = playerConfig,
                analyticsConfig = analyticsConfig,
                defaultMetadata = defaultMetadata ?: DefaultMetadata(),
            )
        }

        if (enableMediaSession) {
            mediaSessionPlaybackManager.setupMediaSessionPlayback(nativeId)
        }
    }

    /**
     * Load the source of the given [nativeId] with `config` options from JS.
     * @param nativeId Target player.
     * @param sourceNativeId Target source.
     */
    @ReactMethod
    fun loadSource(nativeId: NativeId, sourceNativeId: String, promise: Promise) {
        promise.unit.resolveOnUiThread {
            getPlayer(nativeId, this@PlayerModule).load(getSource(sourceNativeId))
        }
    }

    /**
     * Load the `offlineSourceConfig` for the player with [nativeId] and offline source module with `offlineModuleNativeId`.
     * @param nativeId Target player.
     * @param offlineContentManagerBridgeId Target offline module.
     * @param options Source configuration options from JS.
     */
    @ReactMethod
    fun loadOfflineContent(
        nativeId: NativeId,
        offlineContentManagerBridgeId: String,
        options: ReadableMap?,
        promise: Promise,
    ) {
        promise.unit.resolveOnUiThread {
            offlineModule
                .getOfflineContentManagerBridgeOrNull(offlineContentManagerBridgeId)
                ?.offlineContentManager
                ?.offlineSourceConfig
                ?.let { getPlayer(nativeId).load(it) }
        }
    }

    /**
     * Call `.unload()` on [nativeId]'s player.
     * @param nativeId Target player Id.
     */
    @ReactMethod
    fun unload(nativeId: NativeId, promise: Promise) {
        promise.unit.resolveOnUiThreadWithPlayer(nativeId) {
            unload()
        }
    }

    /**
     * Call `.play()` on [nativeId]'s player.
     * @param nativeId Target player Id.
     */
    @ReactMethod
    fun play(nativeId: NativeId, promise: Promise) {
        promise.unit.resolveOnUiThreadWithPlayer(nativeId) {
            play()
        }
    }

    /**
     * Call `.pause()` on [nativeId]'s player.
     * @param nativeId Target player Id.
     */
    @ReactMethod
    fun pause(nativeId: NativeId, promise: Promise) {
        promise.unit.resolveOnUiThreadWithPlayer(nativeId) {
            pause()
        }
    }

    /**
     * Call `.seek(time:)` on [nativeId]'s player.
     * @param nativeId Target player Id.
     * @param time Seek time in seconds.
     */
    @ReactMethod
    fun seek(nativeId: NativeId, time: Double, promise: Promise) {
        promise.unit.resolveOnUiThreadWithPlayer(nativeId) {
            seek(time)
        }
    }

    /**
     * Call `.timeShift(offset:)` on [nativeId]'s player.
     * @param nativeId Target player Id.
     * @param offset Offset time in seconds.
     */
    @ReactMethod
    fun timeShift(nativeId: NativeId, offset: Double, promise: Promise) {
        promise.unit.resolveOnUiThreadWithPlayer(nativeId) {
            timeShift(offset)
        }
    }

    /**
     * Call `.mute()` on [nativeId]'s player.
     * @param nativeId Target player Id.
     */
    @ReactMethod
    fun mute(nativeId: NativeId, promise: Promise) {
        promise.unit.resolveOnUiThreadWithPlayer(nativeId) {
            mute()
        }
    }

    /**
     * Call `.unmute()` on [nativeId]'s player.
     * @param nativeId Target player Id.
     */
    @ReactMethod
    fun unmute(nativeId: NativeId, promise: Promise) {
        promise.unit.resolveOnUiThreadWithPlayer(nativeId) {
            unmute()
        }
    }

    /**
     * Call `.destroy()` on [nativeId]'s player.
     * @param nativeId Target player Id.
     */
    @ReactMethod
    fun destroy(nativeId: NativeId, promise: Promise) {
        mediaSessionPlaybackManager.destroy(nativeId)
        promise.unit.resolveOnUiThreadWithPlayer(nativeId) {
            destroy()
            players.remove(nativeId)
        }
    }

    /**
     * Call `.setVolume(volume:)` on [nativeId]'s player.
     * @param nativeId Target player Id.
     * @param volume Volume level integer between 0 to 100.
     */
    @ReactMethod
    fun setVolume(nativeId: NativeId, volume: Int, promise: Promise) {
        promise.unit.resolveOnUiThreadWithPlayer(nativeId) {
            this.volume = volume
        }
    }

    /**
     * Resolve [nativeId]'s current volume.
     * @param nativeId Target player Id.
     * @param promise JS promise object.
     */
    @ReactMethod
    fun getVolume(nativeId: NativeId, promise: Promise) {
        promise.int.resolveOnUiThreadWithPlayer(nativeId) {
            volume
        }
    }

    /**
     * Resolve the source of [nativeId]'s player.
     * @param nativeId Target player Id.
     * @param promise JS promise object.
     */
    @ReactMethod
    fun source(nativeId: NativeId, promise: Promise) {
        promise.map.nullable.resolveOnUiThreadWithPlayer(nativeId) {
            source?.toJson()
        }
    }

    /**
     * Resolve [nativeId]'s current playback time.
     * @param nativeId Target player Id.
     * @param promise JS promise object.
     */
    @ReactMethod
    fun currentTime(nativeId: NativeId, mode: String?, promise: Promise) {
        promise.double.resolveOnUiThreadWithPlayer(nativeId) {
            currentTime + when (mode) {
                "relative" -> playbackTimeOffsetToRelativeTime
                "absolute" -> playbackTimeOffsetToAbsoluteTime
                else -> throw InvalidParameterException("Unknown mode $mode")
            }
        }
    }

    /**
     * Resolve [nativeId]'s current source duration.
     * @param nativeId Target player Id.
     * @param promise JS promise object.
     */
    @ReactMethod
    fun duration(nativeId: NativeId, promise: Promise) {
        promise.double.resolveOnUiThreadWithPlayer(nativeId) {
            duration
        }
    }

    /**
     * Resolve [nativeId]'s current muted state.
     * @param nativeId Target player Id.
     * @param promise JS promise object.
     */
    @ReactMethod
    fun isMuted(nativeId: NativeId, promise: Promise) {
        promise.bool.resolveOnUiThreadWithPlayer(nativeId) {
            isMuted
        }
    }

    /**
     * Resolve [nativeId]'s current playing state.
     * @param nativeId Target player Id.
     * @param promise JS promise object.
     */
    @ReactMethod
    fun isPlaying(nativeId: NativeId, promise: Promise) {
        promise.bool.resolveOnUiThreadWithPlayer(nativeId) {
            isPlaying
        }
    }

    /**
     * Resolve [nativeId]'s current paused state.
     * @param nativeId Target player Id.
     * @param promise JS promise object.
     */
    @ReactMethod
    fun isPaused(nativeId: NativeId, promise: Promise) {
        promise.bool.resolveOnUiThreadWithPlayer(nativeId) {
            isPaused
        }
    }

    /**
     * Resolve [nativeId]'s current live state.
     * @param nativeId Target player Id.
     * @param promise JS promise object.
     */
    @ReactMethod
    fun isLive(nativeId: NativeId, promise: Promise) {
        promise.bool.resolveOnUiThreadWithPlayer(nativeId) {
            isLive
        }
    }

    /**
     * Resolve [nativeId]'s currently selected audio track.
     * @param nativeId Target player Id.
     * @param promise JS promise object.
     */
    @ReactMethod
    fun getAudioTrack(nativeId: NativeId, promise: Promise) {
        promise.map.nullable.resolveOnUiThreadWithPlayer(nativeId) {
            source?.selectedAudioTrack?.toJson()
        }
    }

    /**
     * Resolve [nativeId]'s player available audio tracks.
     * @param nativeId Target player Id.
     * @param promise JS promise object.
     */
    @ReactMethod
    fun getAvailableAudioTracks(nativeId: NativeId, promise: Promise) {
        promise.array.resolveOnUiThreadWithPlayer(nativeId) {
            source?.availableAudioTracks?.mapToReactArray { it.toJson() } ?: Arguments.createArray()
        }
    }

    /**
     * Set [nativeId]'s player audio track.
     * @param nativeId Target player Id.
     * @param trackIdentifier The audio track identifier.
     * @param promise JS promise object.
     */
    @ReactMethod
    fun setAudioTrack(nativeId: NativeId, trackIdentifier: String, promise: Promise) {
        promise.unit.resolveOnUiThreadWithPlayer(nativeId) {
            source?.setAudioTrack(trackIdentifier)
        }
    }

    /**
     * Resolve [nativeId]'s currently selected subtitle track.
     * @param nativeId Target player Id.
     * @param promise JS promise object.
     */
    @ReactMethod
    fun getSubtitleTrack(nativeId: NativeId, promise: Promise) {
        promise.map.nullable.resolveOnUiThreadWithPlayer(nativeId) {
            source?.selectedSubtitleTrack?.toJson()
        }
    }

    /**
     * Resolve [nativeId]'s player available subtitle tracks.
     * @param nativeId Target player Id.
     * @param promise JS promise object.
     */
    @ReactMethod
    fun getAvailableSubtitles(nativeId: NativeId, promise: Promise) {
        promise.array.resolveOnUiThreadWithPlayer(nativeId) {
            source?.availableSubtitleTracks?.mapToReactArray { it.toJson() } ?: Arguments.createArray()
        }
    }

    /**
     * Set [nativeId]'s player subtitle track.
     * @param nativeId Target player Id.
     * @param trackIdentifier The subtitle track identifier.
     * @param promise JS promise object.
     */
    @ReactMethod
    fun setSubtitleTrack(nativeId: NativeId, trackIdentifier: String?, promise: Promise) {
        promise.unit.resolveOnUiThreadWithPlayer(nativeId) {
            source?.setSubtitleTrack(trackIdentifier)
        }
    }

    /**
     * Schedules an `AdItem` in the [nativeId]'s associated player.
     * @param nativeId Target player id.
     * @param adItemJson Json representation of the `AdItem` to be scheduled.
     */
    @ReactMethod
    fun scheduleAd(nativeId: NativeId, adItemJson: ReadableMap, promise: Promise) {
        promise.unit.resolveOnUiThreadWithPlayer(nativeId) {
            scheduleAd(adItemJson.toAdItem() ?: throw IllegalArgumentException("invalid adItem"))
        }
    }

    /**
     * Skips the current ad in [nativeId]'s associated player.
     * Has no effect if the current ad is not skippable or if no ad is being played back.
     * @param nativeId Target player id.
     */
    @ReactMethod
    fun skipAd(nativeId: NativeId, promise: Promise) {
        promise.unit.resolveOnUiThreadWithPlayer(nativeId) {
            skipAd()
        }
    }

    /**
     * Returns `true` while an ad is being played back or when main content playback has been paused for ad playback.
     * @param nativeId Target player id.
     */
    @ReactMethod
    fun isAd(nativeId: NativeId, promise: Promise) {
        promise.unit.resolveOnUiThreadWithPlayer(nativeId) {
            isAd
        }
    }

    /**
     * The current time shift of the live stream in seconds. This value is always 0 if the active [source] is not a
     * live stream or there is no active playback session.
     * @param nativeId Target player id.
     */
    @ReactMethod
    fun getTimeShift(nativeId: NativeId, promise: Promise) {
        promise.double.resolveOnUiThreadWithPlayer(nativeId) {
            timeShift
        }
    }

    /**
     * The limit in seconds for time shifting. This value is either negative or 0 and it is always 0 if the active
     * [source] is not a live stream or there is no active playback session.
     * @param nativeId Target player id.
     */
    @ReactMethod
    fun getMaxTimeShift(nativeId: NativeId, promise: Promise) {
        promise.double.resolveOnUiThreadWithPlayer(nativeId) {
            maxTimeShift
        }
    }

    /**
     * Sets the max selectable bitrate for the player.
     * @param nativeId Target player id.
     * @param maxSelectableBitrate The desired max bitrate limit.
     */
    @ReactMethod
    fun setMaxSelectableBitrate(nativeId: NativeId, maxSelectableBitrate: Int, promise: Promise) {
        promise.unit.resolveOnUiThreadWithPlayer(nativeId) {
            setMaxSelectableVideoBitrate(
                maxSelectableBitrate.takeUnless { it == -1 } ?: Integer.MAX_VALUE,
            )
        }
    }

    /**
     * Returns the thumbnail image for the active `Source` at a certain time.
     * @param nativeId Target player id.
     * @param time Playback time for the thumbnail.
     */
    @ReactMethod
    fun getThumbnail(nativeId: NativeId, time: Double, promise: Promise) {
        promise.map.nullable.resolveOnUiThreadWithPlayer(nativeId) {
            source?.getThumbnail(time)?.toJson()
        }
    }

    /**
     * Initiates casting the current video to a cast-compatible remote device. The user has to choose to which device it
     * should be sent.
     */
    @ReactMethod
    fun castVideo(nativeId: NativeId, promise: Promise) {
        promise.unit.resolveOnUiThreadWithPlayer(nativeId) {
            castVideo()
        }
    }

    /**
     * Stops casting the current video. Has no effect if [isCasting] is false.
     */
    @ReactMethod
    fun castStop(nativeId: NativeId, promise: Promise) {
        promise.unit.resolveOnUiThreadWithPlayer(nativeId) {
            castStop()
        }
    }

    /**
     * Whether casting to a cast-compatible remote device is available. [PlayerEvent.CastAvailable] signals when
     * casting becomes available.
     */
    @ReactMethod
    fun isCastAvailable(nativeId: NativeId, promise: Promise) {
        promise.bool.resolveOnUiThreadWithPlayer(nativeId) {
            isCastAvailable
        }
    }

    /**
     * Whether video is currently being casted to a remote device and not played locally.
     */
    @ReactMethod
    fun isCasting(nativeId: NativeId, promise: Promise) {
        promise.bool.resolveOnUiThreadWithPlayer(nativeId) {
            isCasting
        }
    }

    /**
     * Resolve [nativeId]'s current video quality.
     */
    @ReactMethod
    fun getVideoQuality(nativeId: NativeId, promise: Promise) {
        promise.map.nullable.resolveOnUiThreadWithPlayer(nativeId) {
            source?.selectedVideoQuality?.toJson()
        }
    }

    /**
     * Resolve [nativeId]'s current available video qualities.
     */
    @ReactMethod
    fun getAvailableVideoQualities(nativeId: NativeId, promise: Promise) {
        promise.array.resolveOnUiThreadWithPlayer(nativeId) {
            source?.availableVideoQualities?.mapToReactArray { it.toJson() } ?: Arguments.createArray()
        }
    }

    /**
     * Set [nativeId]'s player video quality.
     * NOTE: ONLY available on Android. No effect on iOS and tvOS devices.
     * @param nativeId Target player Id.
     * @param qualityId The videoQualityId identifier. A list of currently available VideoQualitys can be retrieved via availableVideoQualities. To use automatic quality selection, Quality.AUTO_ID can be passed as qualityId.
     * @param promise JS promise object.
     */
    @ReactMethod
    fun setVideoQuality(nativeId: NativeId, qualityId: String, promise: Promise) {
        promise.unit.resolveOnUiThreadWithPlayer(nativeId) {
            source?.setVideoQuality(qualityId)
        }
    }

    /**
     * Resolve [nativeId]'s current playback speed.
     */
    @ReactMethod
    fun getPlaybackSpeed(nativeId: NativeId, promise: Promise) {
        promise.float.resolveOnUiThreadWithPlayer(nativeId) {
            playbackSpeed
        }
    }

    /**
     * Sets playback speed for the player.
     */
    @ReactMethod
    fun setPlaybackSpeed(nativeId: NativeId, playbackSpeed: Float, promise: Promise) {
        promise.unit.resolveOnUiThreadWithPlayer(nativeId) {
            this.playbackSpeed = playbackSpeed
        }
    }

    private inline fun <T> TPromise<T>.resolveOnUiThreadWithPlayer(
        nativeId: NativeId,
        crossinline block: Player.() -> T,
    ) = resolveOnUiThread { getPlayer(nativeId, this@PlayerModule).block() }
}
