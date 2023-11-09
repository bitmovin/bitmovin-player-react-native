package com.bitmovin.player.reactnative

import android.util.Log
import com.bitmovin.analytics.api.DefaultMetadata
import com.bitmovin.player.api.Player
import com.bitmovin.player.api.analytics.create
import com.bitmovin.player.api.event.PlayerEvent
import com.bitmovin.player.reactnative.converter.JsonConverter
import com.facebook.react.bridge.*
import com.facebook.react.module.annotations.ReactModule
import com.facebook.react.uimanager.UIManagerModule

private const val MODULE_NAME = "PlayerModule"

@ReactModule(name = MODULE_NAME)
class PlayerModule(private val context: ReactApplicationContext) : ReactContextBaseJavaModule(context) {
    /**
     * In-memory mapping from `nativeId`s to `Player` instances.
     */
    private val players: Registry<Player> = mutableMapOf()

    /**
     * JS exported module name.
     */
    override fun getName() = MODULE_NAME

    /**
     * Fetches the `Player` instance associated with `nativeId` from the internal players.
     * @param nativeId `Player` instance ID.
     * @return The associated `Player` instance or `null`.
     */
    fun getPlayer(nativeId: NativeId?): Player? {
        if (nativeId == null) {
            return null
        }
        return players[nativeId]
    }

    /**
     * Creates a new `Player` instance inside the internal players using the provided `config` object.
     * @param config `PlayerConfig` object received from JS.
     */
    @ReactMethod
    fun initWithConfig(nativeId: NativeId, config: ReadableMap?) {
        uiManager()?.addUIBlock {
            if (!players.containsKey(nativeId)) {
                JsonConverter.toPlayerConfig(config).let {
                    players[nativeId] = Player.create(context, it)
                }
            }
        }
    }

    /**
     * Creates a new `Player` instance inside the internal players using the provided `playerConfig` and `analyticsConfig`.
     * @param playerConfigJson `PlayerConfig` object received from JS.
     * @param analyticsConfigJson `AnalyticsConfig` object received from JS.
     */
    @ReactMethod
    fun initWithAnalyticsConfig(nativeId: NativeId, playerConfigJson: ReadableMap?, analyticsConfigJson: ReadableMap?) {
        uiManager()?.addUIBlock {
            if (players.containsKey(nativeId)) {
                Log.d("[PlayerModule]", "Duplicate player creation for id $nativeId")
                return@addUIBlock
            }
            val playerConfig = JsonConverter.toPlayerConfig(playerConfigJson)
            val analyticsConfig = JsonConverter.toAnalyticsConfig(analyticsConfigJson)
            val defaultMetadata = JsonConverter.toAnalyticsDefaultMetadata(
                analyticsConfigJson?.getMap("defaultMetadata"),
            )

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
        }
    }

    /**
     * Load the source of the given `nativeId` with `config` options from JS.
     * @param nativeId Target player.
     * @param sourceNativeId Target source.
     */
    @ReactMethod
    fun loadSource(nativeId: NativeId, sourceNativeId: String) {
        uiManager()?.addUIBlock {
            sourceModule()?.getSource(sourceNativeId)?.let {
                players[nativeId]?.load(it)
            }
        }
    }

    /**
     * Load the `offlineSourceConfig` for the player with `nativeId` and offline source module with `offlineModuleNativeId`.
     * @param nativeId Target player.
     * @param offlineContentManagerBridgeId Target offline module.
     * @param options Source configuration options from JS.
     */
    @ReactMethod
    fun loadOfflineContent(nativeId: NativeId, offlineContentManagerBridgeId: String, options: ReadableMap?) {
        uiManager()?.addUIBlock {
            val offlineSourceConfig = offlineModule()?.getOfflineContentManagerBridge(offlineContentManagerBridgeId)
                ?.offlineContentManager?.offlineSourceConfig

            if (offlineSourceConfig != null) {
                players[nativeId]?.load(offlineSourceConfig)
            }
        }
    }

    /**
     * Call `.unload()` on `nativeId`'s player.
     * @param nativeId Target player Id.
     */
    @ReactMethod
    fun unload(nativeId: NativeId) {
        uiManager()?.addUIBlock {
            players[nativeId]?.unload()
        }
    }

    /**
     * Call `.play()` on `nativeId`'s player.
     * @param nativeId Target player Id.
     */
    @ReactMethod
    fun play(nativeId: NativeId) {
        uiManager()?.addUIBlock {
            players[nativeId]?.play()
        }
    }

    /**
     * Call `.pause()` on `nativeId`'s player.
     * @param nativeId Target player Id.
     */
    @ReactMethod
    fun pause(nativeId: NativeId) {
        uiManager()?.addUIBlock {
            players[nativeId]?.pause()
        }
    }

    /**
     * Call `.seek(time:)` on `nativeId`'s player.
     * @param nativeId Target player Id.
     * @param time Seek time in seconds.
     */
    @ReactMethod
    fun seek(nativeId: NativeId, time: Double) {
        uiManager()?.addUIBlock {
            players[nativeId]?.seek(time)
        }
    }

    /**
     * Call `.timeShift(offset:)` on `nativeId`'s player.
     * @param nativeId Target player Id.
     * @param offset Offset time in seconds.
     */
    @ReactMethod
    fun timeShift(nativeId: NativeId, offset: Double) {
        uiManager()?.addUIBlock {
            players[nativeId]?.timeShift(offset)
        }
    }

    /**
     * Call `.mute()` on `nativeId`'s player.
     * @param nativeId Target player Id.
     */
    @ReactMethod
    fun mute(nativeId: NativeId) {
        uiManager()?.addUIBlock {
            players[nativeId]?.mute()
        }
    }

    /**
     * Call `.unmute()` on `nativeId`'s player.
     * @param nativeId Target player Id.
     */
    @ReactMethod
    fun unmute(nativeId: NativeId) {
        uiManager()?.addUIBlock {
            players[nativeId]?.unmute()
        }
    }

    /**
     * Call `.destroy()` on `nativeId`'s player.
     * @param nativeId Target player Id.
     */
    @ReactMethod
    fun destroy(nativeId: NativeId) {
        uiManager()?.addUIBlock {
            players[nativeId]?.let {
                it.destroy()
                players.remove(nativeId)
            }
        }
    }

    /**
     * Call `.setVolume(volume:)` on `nativeId`'s player.
     * @param nativeId Target player Id.
     * @param volume Volume level integer between 0 to 100.
     */
    @ReactMethod
    fun setVolume(nativeId: NativeId, volume: Int) {
        uiManager()?.addUIBlock {
            players[nativeId]?.volume = volume
        }
    }

    /**
     * Resolve `nativeId`'s current volume.
     * @param nativeId Target player Id.
     * @param promise JS promise object.
     */
    @ReactMethod
    fun getVolume(nativeId: NativeId, promise: Promise) {
        uiManager()?.addUIBlock {
            promise.resolve(players[nativeId]?.volume)
        }
    }

    /**
     * Resolve the source of `nativeId`'s player.
     * @param nativeId Target player Id.
     * @param promise JS promise object.
     */
    @ReactMethod
    fun source(nativeId: NativeId, promise: Promise) {
        uiManager()?.addUIBlock {
            promise.resolve(JsonConverter.fromSource(players[nativeId]?.source))
        }
    }

    /**
     * Resolve `nativeId`'s current playback time.
     * @param nativeId Target player Id.
     * @param promise JS promise object.
     */
    @ReactMethod
    fun currentTime(nativeId: NativeId, mode: String?, promise: Promise) {
        uiManager()?.addUIBlock {
            var timeOffset: Double = 0.0
            if (mode != null) {
                timeOffset = if (mode == "relative") {
                    players[nativeId]?.playbackTimeOffsetToRelativeTime ?: 0.0
                } else {
                    players[nativeId]?.playbackTimeOffsetToAbsoluteTime ?: 0.0
                }
            }
            val currentTime = players[nativeId]?.currentTime
            if (currentTime != null) {
                promise.resolve(currentTime + timeOffset)
            }
        }
    }

    /**
     * Resolve `nativeId`'s current source duration.
     * @param nativeId Target player Id.
     * @param promise JS promise object.
     */
    @ReactMethod
    fun duration(nativeId: NativeId, promise: Promise) {
        uiManager()?.addUIBlock {
            promise.resolve(players[nativeId]?.duration)
        }
    }

    /**
     * Resolve `nativeId`'s current muted state.
     * @param nativeId Target player Id.
     * @param promise JS promise object.
     */
    @ReactMethod
    fun isMuted(nativeId: NativeId, promise: Promise) {
        uiManager()?.addUIBlock {
            promise.resolve(players[nativeId]?.isMuted)
        }
    }

    /**
     * Resolve `nativeId`'s current playing state.
     * @param nativeId Target player Id.
     * @param promise JS promise object.
     */
    @ReactMethod
    fun isPlaying(nativeId: NativeId, promise: Promise) {
        uiManager()?.addUIBlock {
            promise.resolve(players[nativeId]?.isPlaying)
        }
    }

    /**
     * Resolve `nativeId`'s current paused state.
     * @param nativeId Target player Id.
     * @param promise JS promise object.
     */
    @ReactMethod
    fun isPaused(nativeId: NativeId, promise: Promise) {
        uiManager()?.addUIBlock {
            promise.resolve(players[nativeId]?.isPaused)
        }
    }

    /**
     * Resolve `nativeId`'s current live state.
     * @param nativeId Target player Id.
     * @param promise JS promise object.
     */
    @ReactMethod
    fun isLive(nativeId: NativeId, promise: Promise) {
        uiManager()?.addUIBlock {
            promise.resolve(players[nativeId]?.isLive)
        }
    }

    /**
     * Resolve `nativeId`'s currently selected audio track.
     * @param nativeId Target player Id.
     * @param promise JS promise object.
     */
    @ReactMethod
    fun getAudioTrack(nativeId: NativeId, promise: Promise) {
        uiManager()?.addUIBlock {
            promise.resolve(JsonConverter.fromAudioTrack(players[nativeId]?.source?.selectedAudioTrack))
        }
    }

    /**
     * Resolve `nativeId`'s player available audio tracks.
     * @param nativeId Target player Id.
     * @param promise JS promise object.
     */
    @ReactMethod
    fun getAvailableAudioTracks(nativeId: NativeId, promise: Promise) {
        uiManager()?.addUIBlock {
            val audioTracks = Arguments.createArray()
            players[nativeId]?.source?.availableAudioTracks?.let { tracks ->
                tracks.forEach {
                    audioTracks.pushMap(JsonConverter.fromAudioTrack(it))
                }
            }
            promise.resolve(audioTracks)
        }
    }

    /**
     * Set `nativeId`'s player audio track.
     * @param nativeId Target player Id.
     * @param trackIdentifier The audio track identifier.
     * @param promise JS promise object.
     */
    @ReactMethod
    fun setAudioTrack(nativeId: NativeId, trackIdentifier: String, promise: Promise) {
        uiManager()?.addUIBlock {
            players[nativeId]?.source?.setAudioTrack(trackIdentifier)
            promise.resolve(null)
        }
    }

    /**
     * Resolve `nativeId`'s currently selected subtitle track.
     * @param nativeId Target player Id.
     * @param promise JS promise object.
     */
    @ReactMethod
    fun getSubtitleTrack(nativeId: NativeId, promise: Promise) {
        uiManager()?.addUIBlock {
            promise.resolve(JsonConverter.fromSubtitleTrack(players[nativeId]?.source?.selectedSubtitleTrack))
        }
    }

    /**
     * Resolve `nativeId`'s player available subtitle tracks.
     * @param nativeId Target player Id.
     * @param promise JS promise object.
     */
    @ReactMethod
    fun getAvailableSubtitles(nativeId: NativeId, promise: Promise) {
        uiManager()?.addUIBlock {
            val subtitleTracks = Arguments.createArray()
            players[nativeId]?.source?.availableSubtitleTracks?.let { tracks ->
                tracks.forEach {
                    subtitleTracks.pushMap(JsonConverter.fromSubtitleTrack(it))
                }
            }
            promise.resolve(subtitleTracks)
        }
    }

    /**
     * Set `nativeId`'s player subtitle track.
     * @param nativeId Target player Id.
     * @param trackIdentifier The subtitle track identifier.
     * @param promise JS promise object.
     */
    @ReactMethod
    fun setSubtitleTrack(nativeId: NativeId, trackIdentifier: String?, promise: Promise) {
        uiManager()?.addUIBlock {
            players[nativeId]?.source?.setSubtitleTrack(trackIdentifier)
            promise.resolve(null)
        }
    }

    /**
     * Schedules an `AdItem` in the `nativeId`'s associated player.
     * @param nativeId Target player id.
     * @param adItemJson Json representation of the `AdItem` to be scheduled.
     */
    @ReactMethod
    fun scheduleAd(nativeId: NativeId, adItemJson: ReadableMap?) {
        JsonConverter.toAdItem(adItemJson)?.let { adItem ->
            uiManager()?.addUIBlock {
                players[nativeId]?.scheduleAd(adItem)
            }
        }
    }

    /**
     * Skips the current ad in `nativeId`'s associated player.
     * Has no effect if the current ad is not skippable or if no ad is being played back.
     * @param nativeId Target player id.
     */
    @ReactMethod
    fun skipAd(nativeId: NativeId) {
        uiManager()?.addUIBlock {
            players[nativeId]?.skipAd()
        }
    }

    /**
     * Returns `true` while an ad is being played back or when main content playback has been paused for ad playback.
     * @param nativeId Target player id.
     */
    @ReactMethod
    fun isAd(nativeId: NativeId, promise: Promise) {
        uiManager()?.addUIBlock {
            promise.resolve(players[nativeId]?.isAd)
        }
    }

    /**
     * The current time shift of the live stream in seconds. This value is always 0 if the active [source] is not a
     * live stream or there is no active playback session.
     * @param nativeId Target player id.
     */
    @ReactMethod
    fun getTimeShift(nativeId: NativeId, promise: Promise) {
        uiManager()?.addUIBlock {
            promise.resolve(players[nativeId]?.timeShift)
        }
    }

    /**
     * The limit in seconds for time shifting. This value is either negative or 0 and it is always 0 if the active
     * [source] is not a live stream or there is no active playback session.
     * @param nativeId Target player id.
     */
    @ReactMethod
    fun getMaxTimeShift(nativeId: NativeId, promise: Promise) {
        uiManager()?.addUIBlock {
            promise.resolve(players[nativeId]?.maxTimeShift)
        }
    }

    /**
     * Sets the max selectable bitrate for the player.
     * @param nativeId Target player id.
     * @param maxSelectableBitrate The desired max bitrate limit.
     */
    @ReactMethod
    fun setMaxSelectableBitrate(nativeId: NativeId, maxSelectableBitrate: Int) {
        uiManager()?.addUIBlock {
            players[nativeId]?.setMaxSelectableVideoBitrate(
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
        uiManager()?.addUIBlock {
            promise.resolve(JsonConverter.fromThumbnail(players[nativeId]?.source?.getThumbnail(time)))
        }
    }

    /**
     * Initiates casting the current video to a cast-compatible remote device. The user has to choose to which device it
     * should be sent.
     */
    @ReactMethod
    fun castVideo(nativeId: NativeId) {
        uiManager()?.addUIBlock {
            players[nativeId]?.castVideo()
        }
    }

    /**
     * Stops casting the current video. Has no effect if [isCasting] is false.
     */
    @ReactMethod
    fun castStop(nativeId: NativeId) {
        uiManager()?.addUIBlock {
            players[nativeId]?.castStop()
        }
    }

    /**
     * Whether casting to a cast-compatible remote device is available. [PlayerEvent.CastAvailable] signals when
     * casting becomes available.
     */
    @ReactMethod
    fun isCastAvailable(nativeId: NativeId, promise: Promise) {
        uiManager()?.addUIBlock {
            promise.resolve(players[nativeId]?.isCastAvailable)
        }
    }

    /**
     * Whether video is currently being casted to a remote device and not played locally.
     */
    @ReactMethod
    fun isCasting(nativeId: NativeId, promise: Promise) {
        uiManager()?.addUIBlock {
            promise.resolve(players[nativeId]?.isCasting)
        }
    }

    /**
     * Resolve `nativeId`'s current video quality.
     * @param nativeId Target player Id.
     * @param promise JS promise object.
     */
    @ReactMethod
    fun getVideoQuality(nativeId: NativeId, promise: Promise) {
        uiManager()?.addUIBlock {
            promise.resolve(JsonConverter.fromVideoQuality(players[nativeId]?.source?.selectedVideoQuality))
        }
    }

    /**
     * Resolve `nativeId`'s current available video qualities.
     * @param nativeId Target player Id.
     * @param promise JS promise object.
     */
    @ReactMethod
    fun getAvailableVideoQualities(nativeId: NativeId, promise: Promise) {
        uiManager()?.addUIBlock {
            val videoQualities = Arguments.createArray()
            players[nativeId]?.source?.availableVideoQualities?.let { qualities ->
                qualities.forEach {
                    videoQualities.pushMap(JsonConverter.fromVideoQuality(it))
                }
            }
            promise.resolve(videoQualities)
        }
    }

    /**
     * Resolve `nativeId`'s current playback speed.
     * @param nativeId Target player Id.
     * @param promise JS promise object.
     */
    @ReactMethod
    fun getPlaybackSpeed(nativeId: NativeId, promise: Promise) {
        uiManager()?.addUIBlock {
            promise.resolve(players[nativeId]?.playbackSpeed)
        }
    }

    /**
     * Sets playback speed for the player.
     * @param nativeId Target player Id.
     * @param playbackSpeed Float representing the playback speed level.
     */
    @ReactMethod
    fun setPlaybackSpeed(nativeId: NativeId, playbackSpeed: Float) {
        uiManager()?.addUIBlock {
            players[nativeId]?.playbackSpeed = playbackSpeed
        }
    }

    /**
     * Helper function that returns the initialized `UIManager` instance.
     */
    private fun uiManager(): UIManagerModule? =
        context.getNativeModule(UIManagerModule::class.java)

    /**
     * Helper function that returns the initialized `SourceModule` instance.
     */
    private fun sourceModule(): SourceModule? =
        context.getNativeModule(SourceModule::class.java)

    /**
     * Helper function that returns the initialized `OfflineModule` instance.
     */
    private fun offlineModule(): OfflineModule? =
        context.getNativeModule(OfflineModule::class.java)
}
