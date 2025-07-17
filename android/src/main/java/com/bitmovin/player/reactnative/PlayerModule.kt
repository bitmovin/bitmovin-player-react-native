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

        /**
         * Call .play() on nativeId's player.
         */
        AsyncFunction("play") { nativeId: String ->
            val player = players[nativeId]
            player?.play()
        }.runOnQueue(Queues.MAIN)

        /**
         * Call .pause() on nativeId's player.
         */
        AsyncFunction("pause") { nativeId: String ->
            val player = players[nativeId]
            player?.pause()
        }.runOnQueue(Queues.MAIN)

        /**
         * Call .mute() on nativeId's player.
         */
        AsyncFunction("mute") { nativeId: String ->
            val player = players[nativeId]
            player?.mute()
        }.runOnQueue(Queues.MAIN)

        /**
         * Call .unmute() on nativeId's player.
         */
        AsyncFunction("unmute") { nativeId: String ->
            val player = players[nativeId]
            player?.unmute()
        }.runOnQueue(Queues.MAIN)

        /**
         * Call .seek(time) on nativeId's player.
         */
        AsyncFunction("seek") { nativeId: String, time: Double ->
            val player = players[nativeId]
            player?.seek(time)
        }.runOnQueue(Queues.MAIN)

        /**
         * Sets timeShift on nativeId's player.
         */
        AsyncFunction("timeShift") { nativeId: String, offset: Double ->
            val player = players[nativeId]
            player?.timeShift(offset)
        }.runOnQueue(Queues.MAIN)

        /**
         * Call .destroy() on nativeId's player and remove from registry.
         * Also handles MediaSession cleanup.
         */
        AsyncFunction("destroy") { nativeId: String ->
            val player = players[nativeId]
            if (player != null) {
                // Note: MediaSession cleanup would need to be handled here
                // For now, just destroy the player and remove from registry
                player.destroy()
                players.remove(nativeId)
            }
        }.runOnQueue(Queues.MAIN)

        /**
         * Call .setVolume(volume) on nativeId's player.
         */
        AsyncFunction("setVolume") { nativeId: String, volume: Double ->
            val player = players[nativeId]
            player?.volume = volume.toInt()
        }.runOnQueue(Queues.MAIN)

        /**
         * Resolve nativeId's current volume.
         */
        AsyncFunction("getVolume") { nativeId: String ->
            val player = players[nativeId]
            return@AsyncFunction player?.volume?.toDouble()
        }

        /**
         * Resolve nativeId's current time.
         */
        AsyncFunction("currentTime") { nativeId: String, mode: String? ->
            val player = players[nativeId]
            return@AsyncFunction when {
                player == null -> null
                mode == "relative" -> player.currentTime + player.playbackTimeOffsetToRelativeTime
                mode == "absolute" -> player.currentTime + player.playbackTimeOffsetToAbsoluteTime
                else -> player.currentTime
            }
        }

        /**
         * Resolve nativeId's current playing state.
         */
        AsyncFunction("isPlaying") { nativeId: String ->
            val player = players[nativeId]
            return@AsyncFunction player?.isPlaying
        }

        /**
         * Resolve nativeId's current paused state.
         */
        AsyncFunction("isPaused") { nativeId: String ->
            val player = players[nativeId]
            return@AsyncFunction player?.isPaused
        }

        /**
         * Resolve nativeId's current source duration.
         */
        AsyncFunction("duration") { nativeId: String ->
            val player = players[nativeId]
            return@AsyncFunction player?.duration
        }

        /**
         * Resolve nativeId's current muted state.
         */
        AsyncFunction("isMuted") { nativeId: String ->
            val player = players[nativeId]
            return@AsyncFunction player?.isMuted
        }

        /**
         * Call .unload() on nativeId's player.
         */
        AsyncFunction("unload") { nativeId: String ->
            val player = players[nativeId]
            player?.unload()
        }.runOnQueue(Queues.MAIN)

        /**
         * Resolve nativeId's current time shift value.
         */
        AsyncFunction("getTimeShift") { nativeId: String ->
            val player = players[nativeId]
            return@AsyncFunction player?.timeShift
        }

        /**
         * Resolve nativeId's live stream state.
         */
        AsyncFunction("isLive") { nativeId: String ->
            val player = players[nativeId]
            return@AsyncFunction player?.isLive
        }

        /**
         * Resolve nativeId's maximum time shift value.
         */
        AsyncFunction("getMaxTimeShift") { nativeId: String ->
            val player = players[nativeId]
            return@AsyncFunction player?.maxTimeShift
        }

        /**
         * Resolve nativeId's current playback speed.
         */
        AsyncFunction("getPlaybackSpeed") { nativeId: String ->
            val player = players[nativeId]
            return@AsyncFunction player?.playbackSpeed?.toDouble()
        }

        /**
         * Set playback speed for nativeId's player.
         */
        AsyncFunction("setPlaybackSpeed") { nativeId: String, playbackSpeed: Double ->
            val player = players[nativeId]
            player?.playbackSpeed = playbackSpeed.toFloat()
        }.runOnQueue(Queues.MAIN)

        /**
         * Resolve nativeId's current ad state.
         */
        AsyncFunction("isAd") { nativeId: String ->
            val player = players[nativeId]
            return@AsyncFunction player?.isAd
        }

        /**
         * Set maximum selectable bitrate for nativeId's player.
         */
        AsyncFunction("setMaxSelectableBitrate") { nativeId: String, maxBitrate: Double ->
            val player = players[nativeId]
            player?.setMaxSelectableVideoBitrate(maxBitrate.toInt())
        }.runOnQueue(Queues.MAIN)

        /**
         * Resolve nativeId's AirPlay activation state (Android returns null).
         */
        AsyncFunction("isAirPlayActive") { _: String ->
            // AirPlay is iOS-only, return null on Android
            false
        }

        /**
         * Resolve nativeId's AirPlay availability state (Android returns null).
         */
        AsyncFunction("isAirPlayAvailable") { _: String ->
            // AirPlay is iOS-only, return null on Android
            false
        }

        /**
         * Resolve nativeId's cast availability state.
         */
        AsyncFunction("isCastAvailable") { nativeId: String ->
            val player = players[nativeId]
            return@AsyncFunction player?.isCastAvailable
        }

        /**
         * Resolve nativeId's current casting state.
         */
        AsyncFunction("isCasting") { nativeId: String ->
            val player = players[nativeId]
            return@AsyncFunction player?.isCasting
        }

        /**
         * Initiate casting for nativeId's player.
         */
        AsyncFunction("castVideo") { nativeId: String ->
            val player = players[nativeId]
            player?.castVideo()
        }.runOnQueue(Queues.MAIN)

        /**
         * Stop casting for nativeId's player.
         */
        AsyncFunction("castStop") { nativeId: String ->
            val player = players[nativeId]
            player?.castStop()
        }.runOnQueue(Queues.MAIN)

        /**
         * Skip current ad for nativeId's player.
         */
        AsyncFunction("skipAd") { nativeId: String ->
            val player = players[nativeId]
            player?.skipAd()
        }.runOnQueue(Queues.MAIN)

        /**
         * Check if player can play at specified playback speed (Android returns null).
         */
        AsyncFunction("canPlayAtPlaybackSpeed") { _: String, _: Double ->
            // This method is iOS-only, return false on Android
            false
        }

        /**
         * Get current audio track.
         */
        AsyncFunction("getAudioTrack") { nativeId: String ->
            val player = players[nativeId]
            return@AsyncFunction player?.source?.selectedAudioTrack?.toJson()
        }

        /**
         * Get all available audio tracks.
         */
        AsyncFunction("getAvailableAudioTracks") { nativeId: String ->
            val player = players[nativeId]
            return@AsyncFunction player?.source?.availableAudioTracks?.map { it.toJson() } ?: emptyList()
        }

        /**
         * Set audio track.
         */
        AsyncFunction("setAudioTrack") { nativeId: String, trackIdentifier: String ->
            val player = players[nativeId]
            player?.source?.setAudioTrack(trackIdentifier)
        }.runOnQueue(Queues.MAIN)

        /**
         * Get current subtitle track.
         */
        AsyncFunction("getSubtitleTrack") { nativeId: String ->
            val player = players[nativeId]
            return@AsyncFunction player?.source?.selectedSubtitleTrack?.toJson()
        }

        /**
         * Get all available subtitle tracks.
         */
        AsyncFunction("getAvailableSubtitles") { nativeId: String ->
            val player = players[nativeId]
            return@AsyncFunction player?.source?.availableSubtitleTracks?.map { it.toJson() } ?: emptyList()
        }

        /**
         * Set subtitle track.
         */
        AsyncFunction("setSubtitleTrack") { nativeId: String, trackIdentifier: String? ->
            val player = players[nativeId]
            player?.source?.setSubtitleTrack(trackIdentifier)
        }.runOnQueue(Queues.MAIN)

        /**
         * Get current video quality.
         */
        AsyncFunction("getVideoQuality") { nativeId: String ->
            val player = players[nativeId]
            return@AsyncFunction player?.videoQuality?.toJson()
        }

        /**
         * Get all available video qualities.
         */
        AsyncFunction("getAvailableVideoQualities") { nativeId: String ->
            val player = players[nativeId]
            return@AsyncFunction player?.availableVideoQualities?.map { it.toJson() } ?: emptyList()
        }

        /**
         * Set video quality.
         */
        AsyncFunction("setVideoQuality") { nativeId: String, qualityId: String ->
            val player = players[nativeId]
            player?.source?.setVideoQuality(qualityId)
        }.runOnQueue(Queues.MAIN)

        /**
         * Get thumbnail for time position.
         */
        AsyncFunction("getThumbnail") { nativeId: String, time: Double ->
            val player = players[nativeId]
            return@AsyncFunction player?.getThumbnail(time)?.toJson()
        }
        AsyncFunction("loadOfflineContent") { nativeId: String, offlineContentManagerBridgeId: String,
            options: Map<String, Any>?, ->
            val player = players[nativeId] ?: return@AsyncFunction
            val offlineContentManagerBridge = appContext.registry.getModule<OfflineModule>()
                ?.getOfflineContentManagerBridge(offlineContentManagerBridgeId)

            offlineContentManagerBridge?.offlineContentManager?.offlineSourceConfig?.let {
                player.load(it)
            }
        }.runOnQueue(Queues.MAIN)

        /**
         * Schedule an ad item in the player.
         */
        AsyncFunction("scheduleAd") { nativeId: String, adItemJson: Map<String, Any> ->
            val player = players[nativeId]
            val adItem = adItemJson.toAdItem()
            if (player != null && adItem != null) {
                player.scheduleAd(adItem)
            }
        }.runOnQueue(Queues.MAIN)

        /**
         * Creates a new Player instance using the provided config.
         * This is a complex method requiring config conversion and cross-module setup.
         */
        AsyncFunction("initializeWithConfig") { nativeId: String, config: Map<String, Any>?,
            networkNativeId: String?, decoderNativeId: String?, ->
            initializePlayer(nativeId, config, networkNativeId, decoderNativeId, null)
        }.runOnQueue(Queues.MAIN)

        /**
         * Creates a new analytics-enabled Player instance.
         */
        AsyncFunction("initializeWithAnalyticsConfig") { nativeId: String, analyticsConfigJson: Map<String, Any>,
            config: Map<String, Any>?, networkNativeId: String?, decoderNativeId: String?, ->
            initializePlayer(nativeId, config, networkNativeId, decoderNativeId, analyticsConfigJson)
        }.runOnQueue(Queues.MAIN)

        /**
         * Load source into the player.
         * This requires cross-module dependency on SourceModule.
         */
        AsyncFunction("loadSource") { nativeId: String, sourceNativeId: String ->
            val player = players[nativeId]
            val source = appContext.registry.getModule<SourceModule>()?.getSourceOrNull(sourceNativeId)
            if (player != null && source != null) {
                player.load(source)
            }
        }.runOnQueue(Queues.MAIN)

        /**
         * Get the current source from the player.
         */
        AsyncFunction("source") { nativeId: String ->
            val player = players[nativeId]
            return@AsyncFunction player?.source?.toJson()
        }
    }

    private fun initializePlayer(
        nativeId: String,
        config: Map<String, Any>?,
        networkNativeId: String?,
        decoderNativeId: String?,
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
