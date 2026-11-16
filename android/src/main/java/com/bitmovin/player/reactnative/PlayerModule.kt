package com.bitmovin.player.reactnative

import com.bitmovin.player.api.Player
import com.bitmovin.player.api.analytics.AnalyticsApi.Companion.analytics
import com.bitmovin.player.api.media.MediaType
import com.bitmovin.player.api.playlist.PlaylistConfig
import com.bitmovin.player.api.playlist.PlaylistOptions
import com.bitmovin.player.api.source.Source
import com.bitmovin.player.reactnative.converter.IS_GOOGLE_IMA_ENABLED
import com.bitmovin.player.reactnative.converter.toAdItem
import com.bitmovin.player.reactnative.converter.toAnalyticsCustomData
import com.bitmovin.player.reactnative.converter.toBufferTypeOrThrow
import com.bitmovin.player.reactnative.converter.toJson
import com.bitmovin.player.reactnative.converter.toReplayMode
import expo.modules.kotlin.exception.CodedException
import expo.modules.kotlin.functions.Queues
import expo.modules.kotlin.jni.JavaScriptValue
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class PlayerModule : Module() {
    private val mediaSessionPlaybackManager by lazy { MediaSessionPlaybackManager(appContext) }

    override fun definition() = ModuleDefinition {
        Name("PlayerModule")
        Constant("isGoogleImaEnabled") { IS_GOOGLE_IMA_ENABLED }
        Class(SharedPlayer::class) {
            Constructor { config: JavaScriptValue?, analytics: Map<String, Any>? ->
                SharedPlayer.create(
                    appContext,
                    config?.getObject(),
                    analytics,
                    mediaSessionPlaybackManager,
                )
            }

            AsyncFunction("loadPlaylist") { shared: SharedPlayer, sources: List<SharedSource>,
                options: Map<String, Any>?, ->
                val nativeSources = sources.map { it.source }
                ensureSourcesAvailable(shared.player, nativeSources)
                shared.player.load(
                    PlaylistConfig(
                        nativeSources,
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

            AsyncFunction("destroy", SharedPlayer::destroy).runOnQueue(Queues.MAIN)

            AsyncFunction("loadSource") { shared: SharedPlayer, sharedSource: SharedSource ->
                ensureSourcesAvailable(shared.player, listOf(sharedSource.source))
                shared.player.load(sharedSource.source)
            }.runOnQueue(Queues.MAIN)
        }

        Class(SharedBufferApi::class) {
            Constructor { owner: SharedPlayer -> SharedBufferApi(owner) }
            AsyncFunction("getLevel") { shared: SharedBufferApi, type: String ->
                val buffer = shared.player.buffer
                val bufferType = type.toBufferTypeOrThrow()
                mapOf(
                    "audio" to buffer.getLevel(bufferType, MediaType.Audio).toJson(),
                    "video" to buffer.getLevel(bufferType, MediaType.Video).toJson(),
                )
            }.runOnQueue(Queues.MAIN)
            AsyncFunction("setTargetLevel") { shared: SharedBufferApi, type: String, value: Double ->
                shared.player.buffer.setTargetLevel(type.toBufferTypeOrThrow(), value)
            }.runOnQueue(Queues.MAIN)
        }

        Class(SharedAnalyticsApi::class) {
            Constructor { owner: SharedPlayer -> SharedAnalyticsApi(owner) }
            AsyncFunction("sendCustomDataEvent") { shared: SharedAnalyticsApi, json: Map<String, Any?> ->
                checkNotNull(shared.player.analytics) { "Analytics is disabled" }
                    .sendCustomDataEvent(json.toAnalyticsCustomData())
            }.runOnQueue(Queues.MAIN)
            AsyncFunction("getUserId") { shared: SharedAnalyticsApi ->
                checkNotNull(shared.player.analytics) { "Analytics is disabled" }.userId
            }.runOnQueue(Queues.MAIN)
        }

        AsyncFunction("play") { owner: SharedPlayer ->
            val player = owner.player
            player?.play()
        }.runOnQueue(Queues.MAIN)

        AsyncFunction("pause") { owner: SharedPlayer ->
            val player = owner.player
            player?.pause()
        }.runOnQueue(Queues.MAIN)

        AsyncFunction("mute") { owner: SharedPlayer ->
            val player = owner.player
            player?.mute()
        }.runOnQueue(Queues.MAIN)

        AsyncFunction("unmute") { owner: SharedPlayer ->
            val player = owner.player
            player?.unmute()
        }.runOnQueue(Queues.MAIN)

        AsyncFunction("seek") { owner: SharedPlayer, time: Double ->
            val player = owner.player
            player?.seek(time)
        }.runOnQueue(Queues.MAIN)

        AsyncFunction("timeShift") { owner: SharedPlayer, offset: Double ->
            val player = owner.player
            player?.timeShift(offset)
        }.runOnQueue(Queues.MAIN)

        AsyncFunction("setVolume") { owner: SharedPlayer, volume: Double ->
            val player = owner.player
            player?.volume = volume.toInt()
        }.runOnQueue(Queues.MAIN)

        AsyncFunction("getVolume") { owner: SharedPlayer ->
            val player = owner.player
            return@AsyncFunction player?.volume?.toDouble()
        }.runOnQueue(Queues.MAIN)

        AsyncFunction("getCurrentTime") { owner: SharedPlayer, mode: String? ->
            val player = owner.player
            return@AsyncFunction when {
                player == null -> null
                mode == "relative" -> player.currentTime + player.playbackTimeOffsetToRelativeTime
                mode == "absolute" -> player.currentTime + player.playbackTimeOffsetToAbsoluteTime
                else -> player.currentTime
            }
        }.runOnQueue(Queues.MAIN)

        AsyncFunction("isPlaying") { owner: SharedPlayer ->
            val player = owner.player
            return@AsyncFunction player?.isPlaying
        }.runOnQueue(Queues.MAIN)

        AsyncFunction("isPaused") { owner: SharedPlayer ->
            val player = owner.player
            return@AsyncFunction player?.isPaused
        }.runOnQueue(Queues.MAIN)

        AsyncFunction("getDuration") { owner: SharedPlayer ->
            val player = owner.player
            return@AsyncFunction player?.duration
        }.runOnQueue(Queues.MAIN)

        AsyncFunction("isMuted") { owner: SharedPlayer ->
            val player = owner.player
            return@AsyncFunction player?.isMuted
        }.runOnQueue(Queues.MAIN)

        AsyncFunction("unload") { owner: SharedPlayer ->
            val player = owner.player
            player?.unload()
        }.runOnQueue(Queues.MAIN)

        AsyncFunction("getTimeShift") { owner: SharedPlayer ->
            val player = owner.player
            return@AsyncFunction player?.timeShift
        }.runOnQueue(Queues.MAIN)

        AsyncFunction("isLive") { owner: SharedPlayer ->
            val player = owner.player
            return@AsyncFunction player?.isLive
        }.runOnQueue(Queues.MAIN)

        AsyncFunction("getMaxTimeShift") { owner: SharedPlayer ->
            val player = owner.player
            return@AsyncFunction player?.maxTimeShift
        }.runOnQueue(Queues.MAIN)

        AsyncFunction("getPlaybackSpeed") { owner: SharedPlayer ->
            val player = owner.player
            return@AsyncFunction player?.playbackSpeed?.toDouble()
        }.runOnQueue(Queues.MAIN)

        AsyncFunction("setPlaybackSpeed") { owner: SharedPlayer, playbackSpeed: Double ->
            val player = owner.player
            player?.playbackSpeed = playbackSpeed.toFloat()
        }.runOnQueue(Queues.MAIN)

        AsyncFunction("isAd") { owner: SharedPlayer ->
            val player = owner.player
            return@AsyncFunction player?.isAd
        }.runOnQueue(Queues.MAIN)

        AsyncFunction("setMaxSelectableBitrate") { owner: SharedPlayer, maxBitrate: Double ->
            val player = owner.player
            player?.setMaxSelectableVideoBitrate(maxBitrate.toInt())
        }.runOnQueue(Queues.MAIN)

        AsyncFunction("isAirPlayActive") { _: String ->
            // AirPlay is iOS-only, return null on Android
            false
        }.runOnQueue(Queues.MAIN)

        AsyncFunction("isAirPlayAvailable") { _: String ->
            // AirPlay is iOS-only, return null on Android
            false
        }.runOnQueue(Queues.MAIN)

        AsyncFunction("showAirPlayTargetPicker") { _: String ->
            // AirPlay is iOS-only, no-op on Android
        }.runOnQueue(Queues.MAIN)

        AsyncFunction("isCastAvailable") { owner: SharedPlayer ->
            val player = owner.player
            return@AsyncFunction player?.isCastAvailable
        }.runOnQueue(Queues.MAIN)

        AsyncFunction("isCasting") { owner: SharedPlayer ->
            val player = owner.player
            return@AsyncFunction player?.isCasting
        }.runOnQueue(Queues.MAIN)

        AsyncFunction("castVideo") { owner: SharedPlayer ->
            val player = owner.player
            player?.castVideo()
        }.runOnQueue(Queues.MAIN)

        AsyncFunction("castStop") { owner: SharedPlayer ->
            val player = owner.player
            player?.castStop()
        }.runOnQueue(Queues.MAIN)

        AsyncFunction("skipAd") { owner: SharedPlayer ->
            val player = owner.player
            player?.skipAd()
        }.runOnQueue(Queues.MAIN)

        AsyncFunction("canPlayAtPlaybackSpeed") { _: String, _: Double ->
            // This method is iOS-only, return false on Android
            false
        }.runOnQueue(Queues.MAIN)

        AsyncFunction("getAudioTrack") { owner: SharedPlayer ->
            val player = owner.player
            return@AsyncFunction player?.source?.selectedAudioTrack?.toJson()
        }.runOnQueue(Queues.MAIN)

        AsyncFunction("getAvailableAudioTracks") { owner: SharedPlayer ->
            val player = owner.player
            return@AsyncFunction player?.source?.availableAudioTracks?.map { it.toJson() } ?: emptyList()
        }.runOnQueue(Queues.MAIN)

        AsyncFunction("setAudioTrack") { owner: SharedPlayer, trackIdentifier: String ->
            val player = owner.player
            player?.source?.setAudioTrack(trackIdentifier)
        }.runOnQueue(Queues.MAIN)

        AsyncFunction("getSubtitleTrack") { owner: SharedPlayer ->
            val player = owner.player
            return@AsyncFunction player?.source?.selectedSubtitleTrack?.toJson()
        }.runOnQueue(Queues.MAIN)

        AsyncFunction("getAvailableSubtitles") { owner: SharedPlayer ->
            val player = owner.player
            return@AsyncFunction player?.source?.availableSubtitleTracks?.map { it.toJson() } ?: emptyList()
        }.runOnQueue(Queues.MAIN)

        AsyncFunction("setSubtitleTrack") { owner: SharedPlayer, trackIdentifier: String? ->
            val player = owner.player
            player?.source?.setSubtitleTrack(trackIdentifier)
        }.runOnQueue(Queues.MAIN)

        AsyncFunction("getVideoQuality") { owner: SharedPlayer ->
            val player = owner.player
            return@AsyncFunction player?.videoQuality?.toJson()
        }.runOnQueue(Queues.MAIN)

        AsyncFunction("getAvailableVideoQualities") { owner: SharedPlayer ->
            val player = owner.player
            return@AsyncFunction player?.availableVideoQualities?.map { it.toJson() } ?: emptyList()
        }.runOnQueue(Queues.MAIN)

        AsyncFunction("setVideoQuality") { owner: SharedPlayer, qualityId: String ->
            val player = owner.player
            player?.source?.setVideoQuality(qualityId)
        }.runOnQueue(Queues.MAIN)

        AsyncFunction("getThumbnail") { owner: SharedPlayer, time: Double ->
            val player = owner.player
            return@AsyncFunction player?.getThumbnail(time)?.toJson()
        }.runOnQueue(Queues.MAIN)

        AsyncFunction("loadOfflineContent") { owner: SharedPlayer, offlineId: String, options: Map<String, Any>? ->
            val manager = appContext.registry.getModule<OfflineModule>()?.getOfflineContentManagerBridge(offlineId)
                ?: return@AsyncFunction false
            val config = manager.offlineContentManager?.offlineSourceConfig ?: return@AsyncFunction false
            owner.player.load(config)
            true
        }.runOnQueue(Queues.MAIN)

        AsyncFunction("scheduleAd") { owner: SharedPlayer, adItemJson: Map<String, Any> ->
            val player = owner.player
            val adItem = adItemJson.toAdItem()
            if (player != null && adItem != null) {
                player.scheduleAd(adItem)
            }
        }.runOnQueue(Queues.MAIN)
    }
}

// The SDK checks foreign attachment after unloading, which can leave the Player unable to load again.
private fun ensureSourcesAvailable(player: Player, sources: List<Source>) {
    val sessionSources = player.playlist.sources
    if (sources.any { source -> source.isAttachedToPlayer && sessionSources.none { it === source } }) {
        throw CodedException("ERR_SOURCE_ALREADY_ATTACHED", "Source is already attached to another player", null)
    }
}
