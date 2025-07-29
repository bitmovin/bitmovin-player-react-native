package com.bitmovin.player.reactnative

import com.bitmovin.analytics.api.DefaultMetadata
import com.bitmovin.player.api.Player
import com.bitmovin.player.api.PlayerConfig
import com.bitmovin.player.api.analytics.create
import com.bitmovin.player.reactnative.converter.toAdItem
import com.bitmovin.player.reactnative.converter.toAnalyticsConfig
import com.bitmovin.player.reactnative.converter.toAnalyticsDefaultMetadata
import com.bitmovin.player.reactnative.converter.toJson
import com.bitmovin.player.reactnative.converter.toMediaControlConfig
import com.bitmovin.player.reactnative.converter.toPlayerConfig
import com.bitmovin.player.reactnative.extensions.getMap
import expo.modules.kotlin.functions.Queues
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class PlayerModule : Module() {
    /**
     * In-memory mapping from [NativeId]s to [Player] instances.
     * This must match the Registry pattern from legacy PlayerModule
     */
    private val players: Registry<Player> = mutableMapOf()

    val mediaSessionPlaybackManager by lazy { MediaSessionPlaybackManager(appContext) }

    override fun definition() = ModuleDefinition {
        Name("PlayerModule")

        OnCreate {
            // Module initialization
        }

        OnDestroy {
            // Clean up all players when module is destroyed
            players.values.forEach { player ->
                try {
                    player.destroy()
                } catch (e: Exception) {
                    // Log but don't crash on cleanup
                }
            }
            players.clear()
        }

        AsyncFunction("play") { nativeId: NativeId ->
            val player = players[nativeId]
            player?.play()
        }.runOnQueue(Queues.MAIN)

        AsyncFunction("pause") { nativeId: NativeId ->
            val player = players[nativeId]
            player?.pause()
        }.runOnQueue(Queues.MAIN)

        AsyncFunction("mute") { nativeId: NativeId ->
            val player = players[nativeId]
            player?.mute()
        }.runOnQueue(Queues.MAIN)

        AsyncFunction("unmute") { nativeId: NativeId ->
            val player = players[nativeId]
            player?.unmute()
        }.runOnQueue(Queues.MAIN)

        AsyncFunction("seek") { nativeId: NativeId, time: Double ->
            val player = players[nativeId]
            player?.seek(time)
        }.runOnQueue(Queues.MAIN)

        AsyncFunction("timeShift") { nativeId: NativeId, offset: Double ->
            val player = players[nativeId]
            player?.timeShift(offset)
        }.runOnQueue(Queues.MAIN)

        AsyncFunction("destroy") { nativeId: NativeId ->
            val player = players[nativeId]
            if (player != null) {
                // Note: MediaSession cleanup would need to be handled here
                // For now, just destroy the player and remove from registry
                player.destroy()
                players.remove(nativeId)
            }
        }.runOnQueue(Queues.MAIN)

        AsyncFunction("setVolume") { nativeId: NativeId, volume: Double ->
            val player = players[nativeId]
            player?.volume = volume.toInt()
        }.runOnQueue(Queues.MAIN)

        AsyncFunction("getVolume") { nativeId: NativeId ->
            val player = players[nativeId]
            return@AsyncFunction player?.volume?.toDouble()
        }

        AsyncFunction("currentTime") { nativeId: NativeId, mode: String? ->
            val player = players[nativeId]
            return@AsyncFunction when {
                player == null -> null
                mode == "relative" -> player.currentTime + player.playbackTimeOffsetToRelativeTime
                mode == "absolute" -> player.currentTime + player.playbackTimeOffsetToAbsoluteTime
                else -> player.currentTime
            }
        }

        AsyncFunction("isPlaying") { nativeId: NativeId ->
            val player = players[nativeId]
            return@AsyncFunction player?.isPlaying
        }

        AsyncFunction("isPaused") { nativeId: NativeId ->
            val player = players[nativeId]
            return@AsyncFunction player?.isPaused
        }

        AsyncFunction("duration") { nativeId: NativeId ->
            val player = players[nativeId]
            return@AsyncFunction player?.duration
        }

        AsyncFunction("isMuted") { nativeId: NativeId ->
            val player = players[nativeId]
            return@AsyncFunction player?.isMuted
        }

        AsyncFunction("unload") { nativeId: NativeId ->
            val player = players[nativeId]
            player?.unload()
        }.runOnQueue(Queues.MAIN)

        AsyncFunction("getTimeShift") { nativeId: NativeId ->
            val player = players[nativeId]
            return@AsyncFunction player?.timeShift
        }

        AsyncFunction("isLive") { nativeId: NativeId ->
            val player = players[nativeId]
            return@AsyncFunction player?.isLive
        }

        AsyncFunction("getMaxTimeShift") { nativeId: NativeId ->
            val player = players[nativeId]
            return@AsyncFunction player?.maxTimeShift
        }

        AsyncFunction("getPlaybackSpeed") { nativeId: NativeId ->
            val player = players[nativeId]
            return@AsyncFunction player?.playbackSpeed?.toDouble()
        }

        AsyncFunction("setPlaybackSpeed") { nativeId: NativeId, playbackSpeed: Double ->
            val player = players[nativeId]
            player?.playbackSpeed = playbackSpeed.toFloat()
        }.runOnQueue(Queues.MAIN)

        AsyncFunction("isAd") { nativeId: NativeId ->
            val player = players[nativeId]
            return@AsyncFunction player?.isAd
        }

        AsyncFunction("setMaxSelectableBitrate") { nativeId: NativeId, maxBitrate: Double ->
            val player = players[nativeId]
            player?.setMaxSelectableVideoBitrate(maxBitrate.toInt())
        }.runOnQueue(Queues.MAIN)

        AsyncFunction("isAirPlayActive") { _: String ->
            // AirPlay is iOS-only, return null on Android
            false
        }

        AsyncFunction("isAirPlayAvailable") { _: String ->
            // AirPlay is iOS-only, return null on Android
            false
        }

        AsyncFunction("isCastAvailable") { nativeId: NativeId ->
            val player = players[nativeId]
            return@AsyncFunction player?.isCastAvailable
        }

        AsyncFunction("isCasting") { nativeId: NativeId ->
            val player = players[nativeId]
            return@AsyncFunction player?.isCasting
        }

        AsyncFunction("castVideo") { nativeId: NativeId ->
            val player = players[nativeId]
            player?.castVideo()
        }.runOnQueue(Queues.MAIN)

        AsyncFunction("castStop") { nativeId: NativeId ->
            val player = players[nativeId]
            player?.castStop()
        }.runOnQueue(Queues.MAIN)

        AsyncFunction("skipAd") { nativeId: NativeId ->
            val player = players[nativeId]
            player?.skipAd()
        }.runOnQueue(Queues.MAIN)

        AsyncFunction("canPlayAtPlaybackSpeed") { _: String, _: Double ->
            // This method is iOS-only, return false on Android
            false
        }

        AsyncFunction("getAudioTrack") { nativeId: NativeId ->
            val player = players[nativeId]
            return@AsyncFunction player?.source?.selectedAudioTrack?.toJson()
        }

        AsyncFunction("getAvailableAudioTracks") { nativeId: NativeId ->
            val player = players[nativeId]
            return@AsyncFunction player?.source?.availableAudioTracks?.map { it.toJson() } ?: emptyList()
        }

        AsyncFunction("setAudioTrack") { nativeId: NativeId, trackIdentifier: String ->
            val player = players[nativeId]
            player?.source?.setAudioTrack(trackIdentifier)
        }.runOnQueue(Queues.MAIN)

        AsyncFunction("getSubtitleTrack") { nativeId: NativeId ->
            val player = players[nativeId]
            return@AsyncFunction player?.source?.selectedSubtitleTrack?.toJson()
        }

        AsyncFunction("getAvailableSubtitles") { nativeId: NativeId ->
            val player = players[nativeId]
            return@AsyncFunction player?.source?.availableSubtitleTracks?.map { it.toJson() } ?: emptyList()
        }

        AsyncFunction("setSubtitleTrack") { nativeId: NativeId, trackIdentifier: String? ->
            val player = players[nativeId]
            player?.source?.setSubtitleTrack(trackIdentifier)
        }.runOnQueue(Queues.MAIN)

        AsyncFunction("getVideoQuality") { nativeId: NativeId ->
            val player = players[nativeId]
            return@AsyncFunction player?.videoQuality?.toJson()
        }

        AsyncFunction("getAvailableVideoQualities") { nativeId: NativeId ->
            val player = players[nativeId]
            return@AsyncFunction player?.availableVideoQualities?.map { it.toJson() } ?: emptyList()
        }

        AsyncFunction("setVideoQuality") { nativeId: NativeId, qualityId: String ->
            val player = players[nativeId]
            player?.source?.setVideoQuality(qualityId)
        }.runOnQueue(Queues.MAIN)

        AsyncFunction("getThumbnail") { nativeId: NativeId, time: Double ->
            val player = players[nativeId]
            return@AsyncFunction player?.getThumbnail(time)?.toJson()
        }
        AsyncFunction("loadOfflineContent") { nativeId: NativeId, offlineContentManagerBridgeId: String,
            options: Map<String, Any>?, ->
            val player = players[nativeId] ?: return@AsyncFunction
            val offlineContentManagerBridge = appContext.registry.getModule<OfflineModule>()
                ?.getOfflineContentManagerBridge(offlineContentManagerBridgeId)

            offlineContentManagerBridge?.offlineContentManager?.offlineSourceConfig?.let {
                player.load(it)
            }
        }.runOnQueue(Queues.MAIN)

        AsyncFunction("scheduleAd") { nativeId: NativeId, adItemJson: Map<String, Any> ->
            val player = players[nativeId]
            val adItem = adItemJson.toAdItem()
            if (player != null && adItem != null) {
                player.scheduleAd(adItem)
            }
        }.runOnQueue(Queues.MAIN)

        AsyncFunction("initializeWithConfig") { nativeId: NativeId, config: Map<String, Any>?,
            networkNativeId: NativeId?, decoderNativeId: NativeId?, ->
            initializePlayer(nativeId, config, networkNativeId, decoderNativeId, null)
        }.runOnQueue(Queues.MAIN)

        AsyncFunction("initializeWithAnalyticsConfig") { nativeId: NativeId, analyticsConfigJson: Map<String, Any>,
            config: Map<String, Any>?, networkNativeId: NativeId?, decoderNativeId: NativeId?, ->
            initializePlayer(nativeId, config, networkNativeId, decoderNativeId, analyticsConfigJson)
        }.runOnQueue(Queues.MAIN)

        AsyncFunction("loadSource") { nativeId: NativeId, sourceNativeId: NativeId ->
            val player = players[nativeId]
            val source = appContext.registry.getModule<SourceModule>()?.getSourceOrNull(sourceNativeId)
            if (player != null && source != null) {
                player.load(source)
            }
        }.runOnQueue(Queues.MAIN)

        AsyncFunction("source") { nativeId: NativeId ->
            val player = players[nativeId]
            return@AsyncFunction player?.source?.toJson()
        }
    }

    private fun initializePlayer(
        nativeId: NativeId,
        config: Map<String, Any>?,
        networkNativeId: NativeId?,
        decoderNativeId: NativeId?,
        analyticsConfigJson: Map<String, Any>?,
    ) {
        if (players.containsKey(nativeId)) {
            // Player already exists for this nativeId
            return
        }

        val playerConfig = config?.toPlayerConfig() ?: PlayerConfig()
        val enableMediaSession = config?.getMap("mediaControlConfig")
            ?.toMediaControlConfig()?.isEnabled ?: true

        val networkConfig = networkNativeId?.let { id ->
            appContext.registry.getModule<NetworkModule>()?.getConfig(id)
        }
        networkConfig?.let {
            playerConfig.networkConfig = it
        }

        val decoderConfig = decoderNativeId?.let {
            appContext.registry.getModule<DecoderConfigModule>()?.getDecoderConfig(it)
        }
        if (decoderConfig != null) {
            playerConfig.playbackConfig = playerConfig.playbackConfig.copy(decoderConfig = decoderConfig)
        }

        val applicationContext = appContext.reactContext?.applicationContext
            ?: throw IllegalStateException("Application context is not available")
        val analyticsConfig = analyticsConfigJson?.toAnalyticsConfig()
        val defaultMetadata = analyticsConfigJson?.getMap("defaultMetadata")?.toAnalyticsDefaultMetadata()

        val player = if (analyticsConfig != null) {
            Player.create(
                context = applicationContext,
                playerConfig = playerConfig,
                analyticsConfig = analyticsConfig,
                defaultMetadata = defaultMetadata ?: DefaultMetadata(),
            )
        } else {
            Player.create(applicationContext, playerConfig)
        }
        players[nativeId] = player

        if (enableMediaSession) {
            mediaSessionPlaybackManager.setupMediaSessionPlayback(nativeId)
        }
    }

    // CRITICAL: This method must remain available for cross-module access
    fun getPlayerOrNull(nativeId: NativeId): Player? = players[nativeId]
}
