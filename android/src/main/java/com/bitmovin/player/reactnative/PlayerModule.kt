package com.bitmovin.player.reactnative

import com.bitmovin.player.api.analytics.AnalyticsApi.Companion.analytics
import com.bitmovin.player.api.media.MediaType
import com.bitmovin.player.api.playlist.PlaylistConfig
import com.bitmovin.player.api.playlist.PlaylistOptions
import com.bitmovin.player.api.playlist.SeekTarget
import com.bitmovin.player.reactnative.converter.IS_GOOGLE_IMA_ENABLED
import com.bitmovin.player.reactnative.converter.toAdItem
import com.bitmovin.player.reactnative.converter.toAnalyticsCustomData
import com.bitmovin.player.reactnative.converter.toBufferTypeOrThrow
import com.bitmovin.player.reactnative.converter.toJson
import com.bitmovin.player.reactnative.converter.toReplayMode
import com.bitmovin.player.reactnative.converter.toTimelineReferencePoint
import com.bitmovin.player.reactnative.offline.OfflineContentManagerBridge
import expo.modules.kotlin.functions.Queues
import expo.modules.kotlin.jni.JavaScriptFunction
import expo.modules.kotlin.jni.JavaScriptValue
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class PlayerModule : Module() {
    private val mediaSessionPlaybackManager by lazy { MediaSessionPlaybackManager(appContext) }

    override fun definition() = ModuleDefinition {
        Name("PlayerModule")
        Constant("isGoogleImaEnabled") { IS_GOOGLE_IMA_ENABLED }
        AsyncFunction("create") { config: Map<String, Any>?, analytics: Map<String, Any>?,
            callback: JavaScriptFunction<JavaScriptValue>?, ->
            SharedPlayer.create(appContext, config, analytics, callback, mediaSessionPlaybackManager)
        }.runOnQueue(Queues.MAIN)

        Class(SharedPlayer::class) {
            AsyncFunction("loadPlaylist") { shared: SharedPlayer, sources: List<SharedSource>,
                options: Map<String, Any>?, ->
                shared.player.load(
                    PlaylistConfig(
                        sources.map { it.source },
                        PlaylistOptions(
                            preloadAllSources = options?.get("preloadAllSources") as? Boolean ?: false,
                            replayMode = options?.get("replayMode").toReplayMode(),
                        ),
                    ),
                )
            }.runOnQueue(Queues.MAIN)

            AsyncFunction("getSource") { shared: SharedPlayer, known: List<SharedSource> ->
                shared.player.source?.let { source ->
                    known.firstOrNull { it.source === source } ?: SharedSource(appContext, source)
                }
            }.runOnQueue(Queues.MAIN)
            AsyncFunction("getPlaylistSources") { shared: SharedPlayer, known: List<SharedSource> ->
                shared.player.playlist.sources.map { source ->
                    known.firstOrNull { it.source === source } ?: SharedSource(appContext, source)
                }
            }.runOnQueue(Queues.MAIN)
            AsyncFunction("playlistAdd") { shared: SharedPlayer, source: SharedSource, index: Int? ->
                if (index == null) {
                    shared.player.playlist.add(source.source)
                } else {
                    shared.player.playlist.add(source.source, index)
                }
            }.runOnQueue(Queues.MAIN)

            AsyncFunction("playlistRemove") { shared: SharedPlayer, source: SharedSource ->
                shared.player.playlist.remove(source.source)
            }.runOnQueue(Queues.MAIN)

            AsyncFunction("playlistRemoveAt") { shared: SharedPlayer, index: Int ->
                shared.player.playlist.remove(index)
            }.runOnQueue(Queues.MAIN)

            AsyncFunction("playlistSeek") { shared: SharedPlayer, source: SharedSource, time: Double ->
                shared.player.playlist.seek(source.source, time)
            }.runOnQueue(Queues.MAIN)

            AsyncFunction("playlistSeekTo") { shared: SharedPlayer, source: SharedSource, target: Map<String, Any> ->
                val reference = target["startOffsetTimelineReference"]?.let {
                    requireNotNull((it as? String)?.toTimelineReferencePoint()) {
                        "Unknown timeline reference point"
                    }
                }
                shared.player.playlist.seek(
                    source.source,
                    SeekTarget((target["offset"] as Number).toDouble(), reference),
                )
            }.runOnQueue(Queues.MAIN)

            AsyncFunction("getBufferLevel") { shared: SharedPlayer, type: String ->
                val buffer = shared.player.buffer
                val bufferType = type.toBufferTypeOrThrow()
                mapOf(
                    "audio" to buffer.getLevel(bufferType, MediaType.Audio).toJson(),
                    "video" to buffer.getLevel(bufferType, MediaType.Video).toJson(),
                )
            }.runOnQueue(Queues.MAIN)

            AsyncFunction("setBufferTargetLevel") { shared: SharedPlayer, type: String, value: Double ->
                shared.player.buffer.setTargetLevel(type.toBufferTypeOrThrow(), value)
            }.runOnQueue(Queues.MAIN)

            AsyncFunction("sendCustomDataEvent") { shared: SharedPlayer, json: Map<String, Any?> ->
                checkNotNull(shared.player.analytics) { "Analytics is disabled" }
                    .sendCustomDataEvent(json.toAnalyticsCustomData())
            }.runOnQueue(Queues.MAIN)

            AsyncFunction("getAnalyticsUserId") { shared: SharedPlayer ->
                checkNotNull(shared.player.analytics) { "Analytics is disabled" }.userId
            }.runOnQueue(Queues.MAIN)

            AsyncFunction("play") { shared: SharedPlayer -> shared.player.play() }.runOnQueue(Queues.MAIN)

            AsyncFunction("pause") { shared: SharedPlayer -> shared.player.pause() }.runOnQueue(Queues.MAIN)

            AsyncFunction("mute") { shared: SharedPlayer -> shared.player.mute() }.runOnQueue(Queues.MAIN)

            AsyncFunction("unmute") { shared: SharedPlayer -> shared.player.unmute() }.runOnQueue(Queues.MAIN)

            AsyncFunction("seek") { shared: SharedPlayer, time: Double ->
                shared.player.seek(time)
            }.runOnQueue(Queues.MAIN)

            AsyncFunction("timeShift") { shared: SharedPlayer, offset: Double ->
                shared.player.timeShift(offset)
            }.runOnQueue(Queues.MAIN)

            AsyncFunction("destroy", SharedPlayer::destroy).runOnQueue(Queues.MAIN)

            AsyncFunction("setVolume") { shared: SharedPlayer, volume: Double ->
                shared.player.volume = volume.toInt()
            }.runOnQueue(Queues.MAIN)

            AsyncFunction("getVolume") { shared: SharedPlayer ->
                shared.player.volume.toDouble()
            }.runOnQueue(Queues.MAIN)

            AsyncFunction("currentTime") { shared: SharedPlayer, mode: String? ->
                val player = shared.player
                when (mode) {
                    "relative" -> player.currentTime + player.playbackTimeOffsetToRelativeTime
                    "absolute" -> player.currentTime + player.playbackTimeOffsetToAbsoluteTime
                    else -> player.currentTime
                }
            }.runOnQueue(Queues.MAIN)

            AsyncFunction("isPlaying") { shared: SharedPlayer -> shared.player.isPlaying }.runOnQueue(Queues.MAIN)

            AsyncFunction("isPaused") { shared: SharedPlayer -> shared.player.isPaused }.runOnQueue(Queues.MAIN)

            AsyncFunction("duration") { shared: SharedPlayer -> shared.player.duration }.runOnQueue(Queues.MAIN)

            AsyncFunction("isMuted") { shared: SharedPlayer -> shared.player.isMuted }.runOnQueue(Queues.MAIN)

            AsyncFunction("unload") { shared: SharedPlayer -> shared.player.unload() }.runOnQueue(Queues.MAIN)

            AsyncFunction("getTimeShift") { shared: SharedPlayer -> shared.player.timeShift }.runOnQueue(Queues.MAIN)

            AsyncFunction("isLive") { shared: SharedPlayer -> shared.player.isLive }.runOnQueue(Queues.MAIN)

            AsyncFunction("getMaxTimeShift") { shared: SharedPlayer ->
                shared.player.maxTimeShift
            }.runOnQueue(Queues.MAIN)

            AsyncFunction("getPlaybackSpeed") { shared: SharedPlayer ->
                shared.player.playbackSpeed.toDouble()
            }.runOnQueue(Queues.MAIN)

            AsyncFunction("setPlaybackSpeed") { shared: SharedPlayer, playbackSpeed: Double ->
                shared.player.playbackSpeed = playbackSpeed.toFloat()
            }.runOnQueue(Queues.MAIN)

            AsyncFunction("isAd") { shared: SharedPlayer -> shared.player.isAd }.runOnQueue(Queues.MAIN)

            AsyncFunction("setMaxSelectableBitrate") { shared: SharedPlayer, maxBitrate: Double ->
                shared.player.setMaxSelectableVideoBitrate(maxBitrate.toInt())
            }.runOnQueue(Queues.MAIN)

            AsyncFunction("isAirPlayActive") { _: SharedPlayer ->
                // AirPlay is iOS-only, return null on Android
                false
            }.runOnQueue(Queues.MAIN)

            AsyncFunction("isAirPlayAvailable") { _: SharedPlayer ->
                // AirPlay is iOS-only, return null on Android
                false
            }.runOnQueue(Queues.MAIN)

            AsyncFunction("showAirPlayTargetPicker") { _: SharedPlayer ->
                // AirPlay is iOS-only, no-op on Android
            }.runOnQueue(Queues.MAIN)

            AsyncFunction("isCastAvailable") { shared: SharedPlayer ->
                shared.player.isCastAvailable
            }.runOnQueue(Queues.MAIN)

            AsyncFunction("isCasting") { shared: SharedPlayer -> shared.player.isCasting }.runOnQueue(Queues.MAIN)

            AsyncFunction("castVideo") { shared: SharedPlayer -> shared.player.castVideo() }.runOnQueue(Queues.MAIN)

            AsyncFunction("castStop") { shared: SharedPlayer -> shared.player.castStop() }.runOnQueue(Queues.MAIN)

            AsyncFunction("skipAd") { shared: SharedPlayer -> shared.player.skipAd() }.runOnQueue(Queues.MAIN)

            AsyncFunction("canPlayAtPlaybackSpeed") { _: SharedPlayer, _: Double ->
                // This method is iOS-only, return false on Android
                false
            }.runOnQueue(Queues.MAIN)

            AsyncFunction("getAudioTrack") { shared: SharedPlayer ->
                shared.player.source?.selectedAudioTrack?.toJson()
            }.runOnQueue(Queues.MAIN)

            AsyncFunction("getAvailableAudioTracks") { shared: SharedPlayer ->
                shared.player.source?.availableAudioTracks?.map { it.toJson() } ?: emptyList()
            }.runOnQueue(Queues.MAIN)

            AsyncFunction("setAudioTrack") { shared: SharedPlayer, trackIdentifier: String ->
                shared.player.source?.setAudioTrack(trackIdentifier)
            }.runOnQueue(Queues.MAIN)

            AsyncFunction("getSubtitleTrack") { shared: SharedPlayer ->
                shared.player.source?.selectedSubtitleTrack?.toJson()
            }.runOnQueue(Queues.MAIN)

            AsyncFunction("getAvailableSubtitles") { shared: SharedPlayer ->
                shared.player.source?.availableSubtitleTracks?.map { it.toJson() } ?: emptyList()
            }.runOnQueue(Queues.MAIN)

            AsyncFunction("setSubtitleTrack") { shared: SharedPlayer, trackIdentifier: String? ->
                shared.player.source?.setSubtitleTrack(trackIdentifier)
            }.runOnQueue(Queues.MAIN)

            AsyncFunction("getVideoQuality") { shared: SharedPlayer ->
                shared.player.videoQuality?.toJson()
            }.runOnQueue(Queues.MAIN)

            AsyncFunction("getAvailableVideoQualities") { shared: SharedPlayer ->
                shared.player.availableVideoQualities.map { it.toJson() }
            }.runOnQueue(Queues.MAIN)

            AsyncFunction("setVideoQuality") { shared: SharedPlayer, qualityId: String ->
                shared.player.source?.setVideoQuality(qualityId)
            }.runOnQueue(Queues.MAIN)

            AsyncFunction("getThumbnail") { shared: SharedPlayer, time: Double ->
                shared.player.getThumbnail(time)?.toJson()
            }.runOnQueue(Queues.MAIN)
            AsyncFunction("loadOfflineContent") { shared: SharedPlayer, offline: OfflineContentManagerBridge,
                options: Map<String, Any>?, ->
                val config = offline.offlineContentManager.offlineSourceConfig ?: return@AsyncFunction false
                shared.player.load(config)
                true
            }.runOnQueue(Queues.MAIN)

            AsyncFunction("scheduleAd") { shared: SharedPlayer, adItemJson: Map<String, Any> ->
                adItemJson.toAdItem()?.let { shared.player.scheduleAd(it) }
            }.runOnQueue(Queues.MAIN)

            AsyncFunction("loadSource") { shared: SharedPlayer, sharedSource: SharedSource ->
                shared.player.load(sharedSource.source)
            }.runOnQueue(Queues.MAIN)
        }
    }
}
