package com.bitmovin.player.reactnative

import androidx.core.os.bundleOf
import com.bitmovin.analytics.api.DefaultMetadata
import com.bitmovin.player.api.Player
import com.bitmovin.player.api.PlayerConfig
import com.bitmovin.player.api.advertising.AdvertisingConfig
import com.bitmovin.player.api.advertising.BeforeInitializationCallback
import com.bitmovin.player.api.analytics.create
import com.bitmovin.player.api.event.Event
import com.bitmovin.player.api.event.PlayerEvent
import com.bitmovin.player.api.playlist.PlaylistConfig
import com.bitmovin.player.api.playlist.PlaylistOptions
import com.bitmovin.player.api.playlist.ReplayMode
import com.bitmovin.player.api.playlist.SeekTarget
import com.bitmovin.player.api.source.Source
import com.bitmovin.player.api.source.TimelineReferencePoint
import com.bitmovin.player.reactnative.converter.applyOnImaSettings
import com.bitmovin.player.reactnative.converter.toAdItem
import com.bitmovin.player.reactnative.converter.toAnalyticsConfig
import com.bitmovin.player.reactnative.converter.toAnalyticsDefaultMetadata
import com.bitmovin.player.reactnative.converter.toJson
import com.bitmovin.player.reactnative.converter.toMap
import com.bitmovin.player.reactnative.converter.toMediaControlConfig
import com.bitmovin.player.reactnative.converter.toPlayerConfig
import com.bitmovin.player.reactnative.extensions.getBooleanOrNull
import com.bitmovin.player.reactnative.extensions.getDoubleOrNull
import com.bitmovin.player.reactnative.extensions.getMap
import com.bitmovin.player.reactnative.extensions.getString
import com.bitmovin.player.reactnative.util.NonFiniteSanitizer
import expo.modules.kotlin.functions.Queues
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class PlayerModule : Module() {

    val mediaSessionPlaybackManager by lazy { MediaSessionPlaybackManager(appContext) }
    private val shouldLoadAdItemWaiter = ResultWaiter<Boolean>()
    private val shouldPlayAdBreakWaiter = ResultWaiter<Boolean>()
    private val imaSettingsWaiter = ResultWaiter<Map<String, Any?>>()
    private val playlistEventSubscriptions = mutableMapOf<NativeId, List<EventSubscription<Event>>>()

    override fun definition() = ModuleDefinition {
        Name("PlayerModule")

        OnCreate {
            // Module initialization
        }

        OnDestroy {
            // Clean up all players when module is destroyed
            PlayerRegistry.getAllNativeIds().forEach { nativeId ->
                PlayerRegistry.getPlayer(nativeId)?.let { detachPlaylistEventListeners(nativeId, it) }
            }
            PlayerRegistry.getAllPlayers().forEach { player ->
                try {
                    player.destroy()
                } catch (e: Exception) {
                    // Log but don't crash on cleanup
                }
            }
            shouldLoadAdItemWaiter.clear()
            shouldPlayAdBreakWaiter.clear()
            imaSettingsWaiter.clear()
            PlayerRegistry.clear()
        }

        Events(
            "onShouldLoadAdItem",
            "onShouldPlayAdBreak",
            "onImaBeforeInitialization",
            "onSourceAdded",
            "onSourceRemoved",
            "onPlaylistTransition",
        )

        AsyncFunction("play") { nativeId: NativeId ->
            val player = PlayerRegistry.getPlayer(nativeId)
            player?.play()
        }.runOnQueue(Queues.MAIN)

        AsyncFunction("pause") { nativeId: NativeId ->
            val player = PlayerRegistry.getPlayer(nativeId)
            player?.pause()
        }.runOnQueue(Queues.MAIN)

        AsyncFunction("mute") { nativeId: NativeId ->
            val player = PlayerRegistry.getPlayer(nativeId)
            player?.mute()
        }.runOnQueue(Queues.MAIN)

        AsyncFunction("unmute") { nativeId: NativeId ->
            val player = PlayerRegistry.getPlayer(nativeId)
            player?.unmute()
        }.runOnQueue(Queues.MAIN)

        AsyncFunction("seek") { nativeId: NativeId, time: Double ->
            val player = PlayerRegistry.getPlayer(nativeId)
            player?.seek(time)
        }.runOnQueue(Queues.MAIN)

        AsyncFunction("timeShift") { nativeId: NativeId, offset: Double ->
            val player = PlayerRegistry.getPlayer(nativeId)
            player?.timeShift(offset)
        }.runOnQueue(Queues.MAIN)

        AsyncFunction("destroy") { nativeId: NativeId ->
            val player = PlayerRegistry.getPlayer(nativeId)
            if (player != null) {
                // Note: MediaSession cleanup would need to be handled here
                // For now, just destroy the player and remove from registry
                detachPlaylistEventListeners(nativeId, player)
                player.destroy()
                PlayerRegistry.unregister(nativeId)
            }
        }.runOnQueue(Queues.MAIN)

        AsyncFunction("setVolume") { nativeId: NativeId, volume: Double ->
            val player = PlayerRegistry.getPlayer(nativeId)
            player?.volume = volume.toInt()
        }.runOnQueue(Queues.MAIN)

        AsyncFunction("getVolume") { nativeId: NativeId ->
            val player = PlayerRegistry.getPlayer(nativeId)
            return@AsyncFunction player?.volume?.toDouble()
        }

        AsyncFunction("currentTime") { nativeId: NativeId, mode: String? ->
            val player = PlayerRegistry.getPlayer(nativeId)
            return@AsyncFunction when {
                player == null -> null
                mode == "relative" -> player.currentTime + player.playbackTimeOffsetToRelativeTime
                mode == "absolute" -> player.currentTime + player.playbackTimeOffsetToAbsoluteTime
                else -> player.currentTime
            }
        }

        AsyncFunction("isPlaying") { nativeId: NativeId ->
            val player = PlayerRegistry.getPlayer(nativeId)
            return@AsyncFunction player?.isPlaying
        }

        AsyncFunction("isPaused") { nativeId: NativeId ->
            val player = PlayerRegistry.getPlayer(nativeId)
            return@AsyncFunction player?.isPaused
        }

        AsyncFunction("duration") { nativeId: NativeId ->
            val player = PlayerRegistry.getPlayer(nativeId)
            return@AsyncFunction player?.duration
        }

        AsyncFunction("isMuted") { nativeId: NativeId ->
            val player = PlayerRegistry.getPlayer(nativeId)
            return@AsyncFunction player?.isMuted
        }

        AsyncFunction("unload") { nativeId: NativeId ->
            val player = PlayerRegistry.getPlayer(nativeId)
            player?.unload()
        }.runOnQueue(Queues.MAIN)

        AsyncFunction("getTimeShift") { nativeId: NativeId ->
            val player = PlayerRegistry.getPlayer(nativeId)
            return@AsyncFunction player?.timeShift
        }

        AsyncFunction("isLive") { nativeId: NativeId ->
            val player = PlayerRegistry.getPlayer(nativeId)
            return@AsyncFunction player?.isLive
        }

        AsyncFunction("getMaxTimeShift") { nativeId: NativeId ->
            val player = PlayerRegistry.getPlayer(nativeId)
            return@AsyncFunction player?.maxTimeShift
        }

        AsyncFunction("getPlaybackSpeed") { nativeId: NativeId ->
            val player = PlayerRegistry.getPlayer(nativeId)
            return@AsyncFunction player?.playbackSpeed?.toDouble()
        }

        AsyncFunction("setPlaybackSpeed") { nativeId: NativeId, playbackSpeed: Double ->
            val player = PlayerRegistry.getPlayer(nativeId)
            player?.playbackSpeed = playbackSpeed.toFloat()
        }.runOnQueue(Queues.MAIN)

        AsyncFunction("isAd") { nativeId: NativeId ->
            val player = PlayerRegistry.getPlayer(nativeId)
            return@AsyncFunction player?.isAd
        }

        AsyncFunction("setMaxSelectableBitrate") { nativeId: NativeId, maxBitrate: Double ->
            val player = PlayerRegistry.getPlayer(nativeId)
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

        AsyncFunction("showAirPlayTargetPicker") { _: String ->
            // AirPlay is iOS-only, no-op on Android
        }

        AsyncFunction("isCastAvailable") { nativeId: NativeId ->
            val player = PlayerRegistry.getPlayer(nativeId)
            return@AsyncFunction player?.isCastAvailable
        }

        AsyncFunction("isCasting") { nativeId: NativeId ->
            val player = PlayerRegistry.getPlayer(nativeId)
            return@AsyncFunction player?.isCasting
        }

        AsyncFunction("castVideo") { nativeId: NativeId ->
            val player = PlayerRegistry.getPlayer(nativeId)
            player?.castVideo()
        }.runOnQueue(Queues.MAIN)

        AsyncFunction("castStop") { nativeId: NativeId ->
            val player = PlayerRegistry.getPlayer(nativeId)
            player?.castStop()
        }.runOnQueue(Queues.MAIN)

        AsyncFunction("skipAd") { nativeId: NativeId ->
            val player = PlayerRegistry.getPlayer(nativeId)
            player?.skipAd()
        }.runOnQueue(Queues.MAIN)

        AsyncFunction("canPlayAtPlaybackSpeed") { _: String, _: Double ->
            // This method is iOS-only, return false on Android
            false
        }

        AsyncFunction("getAudioTrack") { nativeId: NativeId ->
            val player = PlayerRegistry.getPlayer(nativeId)
            return@AsyncFunction player?.source?.selectedAudioTrack?.toJson()
        }

        AsyncFunction("getAvailableAudioTracks") { nativeId: NativeId ->
            val player = PlayerRegistry.getPlayer(nativeId)
            return@AsyncFunction player?.source?.availableAudioTracks?.map { it.toJson() } ?: emptyList()
        }

        AsyncFunction("setAudioTrack") { nativeId: NativeId, trackIdentifier: String ->
            val player = PlayerRegistry.getPlayer(nativeId)
            player?.source?.setAudioTrack(trackIdentifier)
        }.runOnQueue(Queues.MAIN)

        AsyncFunction("getSubtitleTrack") { nativeId: NativeId ->
            val player = PlayerRegistry.getPlayer(nativeId)
            return@AsyncFunction player?.source?.selectedSubtitleTrack?.toJson()
        }

        AsyncFunction("getAvailableSubtitles") { nativeId: NativeId ->
            val player = PlayerRegistry.getPlayer(nativeId)
            return@AsyncFunction player?.source?.availableSubtitleTracks?.map { it.toJson() } ?: emptyList()
        }

        AsyncFunction("setSubtitleTrack") { nativeId: NativeId, trackIdentifier: String? ->
            val player = PlayerRegistry.getPlayer(nativeId)
            player?.source?.setSubtitleTrack(trackIdentifier)
        }.runOnQueue(Queues.MAIN)

        AsyncFunction("getVideoQuality") { nativeId: NativeId ->
            val player = PlayerRegistry.getPlayer(nativeId)
            return@AsyncFunction player?.videoQuality?.toJson()
        }

        AsyncFunction("getAvailableVideoQualities") { nativeId: NativeId ->
            val player = PlayerRegistry.getPlayer(nativeId)
            return@AsyncFunction player?.availableVideoQualities?.map { it.toJson() } ?: emptyList()
        }

        AsyncFunction("setVideoQuality") { nativeId: NativeId, qualityId: String ->
            val player = PlayerRegistry.getPlayer(nativeId)
            player?.source?.setVideoQuality(qualityId)
        }.runOnQueue(Queues.MAIN)

        AsyncFunction("getThumbnail") { nativeId: NativeId, time: Double ->
            val player = PlayerRegistry.getPlayer(nativeId)
            return@AsyncFunction player?.getThumbnail(time)?.toJson()
        }
        AsyncFunction("loadOfflineContent") { nativeId: NativeId, offlineContentManagerBridgeId: String,
            options: Map<String, Any>?, ->
            val player = PlayerRegistry.getPlayer(nativeId) ?: return@AsyncFunction
            val offlineContentManagerBridge = appContext.registry.getModule<OfflineModule>()
                ?.getOfflineContentManagerBridge(offlineContentManagerBridgeId)

            offlineContentManagerBridge?.offlineContentManager?.offlineSourceConfig?.let {
                player.load(it)
            }
        }.runOnQueue(Queues.MAIN)

        AsyncFunction("scheduleAd") { nativeId: NativeId, adItemJson: Map<String, Any> ->
            val player = PlayerRegistry.getPlayer(nativeId)
            val adItem = adItemJson.toAdItem()
            if (player != null && adItem != null) {
                player.scheduleAd(adItem)
            }
        }.runOnQueue(Queues.MAIN)

        AsyncFunction("setPreparedImaSettings") { id: Int, settings: Map<String, Any?>? ->
            imaSettingsWaiter.complete(id, settings ?: emptyMap())
        }

        AsyncFunction("setShouldLoadAdItem") { id: Int, shouldLoad: Boolean ->
            shouldLoadAdItemWaiter.complete(id, shouldLoad)
        }

        AsyncFunction("setShouldPlayAdBreak") { id: Int, shouldPlay: Boolean ->
            shouldPlayAdBreakWaiter.complete(id, shouldPlay)
        }

        AsyncFunction("initializeWithConfig") { nativeId: NativeId, config: Map<String, Any>?,
            networkNativeId: NativeId?, decoderNativeId: NativeId?, ->
            initializePlayer(nativeId, config, networkNativeId, decoderNativeId, null)
        }.runOnQueue(Queues.MAIN)

        AsyncFunction("initializeWithAnalyticsConfig") { nativeId: NativeId, analyticsConfigJson: Map<String, Any>,
            config: Map<String, Any>?, networkNativeId: NativeId?, decoderNativeId: NativeId?, ->
            initializePlayer(nativeId, config, networkNativeId, decoderNativeId, analyticsConfigJson)
        }.runOnQueue(Queues.MAIN)

        AsyncFunction("loadSource") { nativeId: NativeId, sourceNativeId: NativeId ->
            val player = PlayerRegistry.getPlayer(nativeId)
            val source = appContext.registry.getModule<SourceModule>()?.getSourceOrNull(sourceNativeId)
            if (player != null && source != null) {
                player.load(source)
            }
        }.runOnQueue(Queues.MAIN)

        AsyncFunction("loadPlaylist") { nativeId: NativeId, sourceNativeIds: List<String>, options: Map<String, Any?>? ->
            val player = PlayerRegistry.getPlayer(nativeId) ?: return@AsyncFunction
            val sourceModule = appContext.registry.getModule<SourceModule>() ?: return@AsyncFunction
            val sources = sourceNativeIds.mapNotNull { sourceModule.getSourceOrNull(it) }
            if (sources.size != sourceNativeIds.size) return@AsyncFunction
            player.load(PlaylistConfig(sources, options.toPlaylistOptions()))
        }.runOnQueue(Queues.MAIN)

        AsyncFunction("playlistAddSource") { nativeId: NativeId, sourceNativeId: NativeId, index: Int? ->
            val player = PlayerRegistry.getPlayer(nativeId) ?: return@AsyncFunction
            val sourceModule = appContext.registry.getModule<SourceModule>() ?: return@AsyncFunction
            val source = sourceModule.getSourceOrNull(sourceNativeId) ?: return@AsyncFunction
            if (index == null) {
                player.playlist.add(source)
            } else {
                player.playlist.add(source, index)
            }
        }.runOnQueue(Queues.MAIN)

        AsyncFunction("playlistRemoveSource") { nativeId: NativeId, sourceNativeId: NativeId ->
            val player = PlayerRegistry.getPlayer(nativeId) ?: return@AsyncFunction
            val sourceModule = appContext.registry.getModule<SourceModule>() ?: return@AsyncFunction
            val source = sourceModule.getSourceOrNull(sourceNativeId) ?: return@AsyncFunction
            player.playlist.remove(source)
        }.runOnQueue(Queues.MAIN)

        AsyncFunction("playlistRemoveSourceAt") { nativeId: NativeId, index: Int ->
            PlayerRegistry.getPlayer(nativeId)?.playlist?.remove(index)
        }.runOnQueue(Queues.MAIN)

        AsyncFunction("playlistSeekToTime") { nativeId: NativeId, sourceNativeId: NativeId, time: Double? ->
            val player = PlayerRegistry.getPlayer(nativeId) ?: return@AsyncFunction
            val sourceModule = appContext.registry.getModule<SourceModule>() ?: return@AsyncFunction
            val source = sourceModule.getSourceOrNull(sourceNativeId) ?: return@AsyncFunction
            if (time == null) {
                player.playlist.seek(source, null)
            } else {
                player.playlist.seek(source, time)
            }
        }.runOnQueue(Queues.MAIN)

        AsyncFunction("playlistSeekToTarget") { nativeId: NativeId, sourceNativeId: NativeId, target: Map<String, Any?> ->
            val player = PlayerRegistry.getPlayer(nativeId) ?: return@AsyncFunction
            val sourceModule = appContext.registry.getModule<SourceModule>() ?: return@AsyncFunction
            val source = sourceModule.getSourceOrNull(sourceNativeId) ?: return@AsyncFunction
            player.playlist.seek(source, target.toSeekTarget())
        }.runOnQueue(Queues.MAIN)

        AsyncFunction("getPlaylistSources") { nativeId: NativeId ->
            val sourceModule = appContext.registry.getModule<SourceModule>() ?: return@AsyncFunction emptyList<String>()
            return@AsyncFunction PlayerRegistry.getPlayer(nativeId)
                ?.playlist
                ?.sources
                ?.mapNotNull { sourceModule.getNativeId(it) }
                ?: emptyList()
        }

        AsyncFunction("source") { nativeId: NativeId ->
            val player = PlayerRegistry.getPlayer(nativeId)
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
        if (PlayerRegistry.hasPlayer(nativeId)) {
            // Player already exists for this nativeId
            return
        }

        val playerConfig = config?.toPlayerConfig() ?: PlayerConfig()
        @Suppress("UNCHECKED_CAST")
        val configJson = config as? Map<String, Any?>
        setupShouldLoadAdItem(nativeId, configJson, playerConfig)
        setupShouldPlayAdBreak(nativeId, configJson, playerConfig)
        setupImaBeforeInitialization(nativeId, configJson, playerConfig)
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
        PlayerRegistry.register(player, nativeId)
        attachPlaylistEventListeners(nativeId, player)

        if (enableMediaSession) {
            mediaSessionPlaybackManager.setupMediaSessionPlayback(nativeId)
        }
    }

    @Suppress("UNCHECKED_CAST")
    private fun attachPlaylistEventListeners(nativeId: NativeId, player: Player) {
        if (playlistEventSubscriptions.containsKey(nativeId)) return
        val subscriptions = listOf(
            EventSubscription<PlayerEvent.SourceAdded> { event ->
                sendPlaylistEvent(nativeId, "onSourceAdded", event.source, event.index, event)
            },
            EventSubscription<PlayerEvent.SourceRemoved> { event ->
                sendPlaylistEvent(nativeId, "onSourceRemoved", event.source, event.index, event)
            },
            EventSubscription<PlayerEvent.PlaylistTransition> { event ->
                sendPlaylistTransitionEvent(nativeId, event)
            },
        ) as List<EventSubscription<Event>>
        subscriptions.forEach { player.on(it.eventClass, it.eventListener) }
        playlistEventSubscriptions[nativeId] = subscriptions
    }

    private fun detachPlaylistEventListeners(nativeId: NativeId, player: Player) {
        playlistEventSubscriptions.remove(nativeId)?.forEach {
            player.off(it.eventClass, it.eventListener)
        }
    }

    private fun sendPlaylistEvent(
        nativeId: NativeId,
        eventName: String,
        source: Source,
        index: Int,
        event: PlayerEvent,
    ) {
        val sourceNativeId = appContext.registry.getModule<SourceModule>()?.getNativeId(source)
        val payload = mutableMapOf<String, Any?>().apply {
            putAll(event.toJson())
            put("nativeId", nativeId)
            put("name", eventName)
            put("source", source.toJsonWithNativeId(sourceNativeId))
            put("sourceNativeId", sourceNativeId)
            put("index", index)
        }.filterNotNullValues()
        sendEvent(eventName, NonFiniteSanitizer.sanitizeEventData(payload))
    }

    private fun sendPlaylistTransitionEvent(nativeId: NativeId, event: PlayerEvent.PlaylistTransition) {
        val sourceModule = appContext.registry.getModule<SourceModule>()
        val fromNativeId = sourceModule?.getNativeId(event.from)
        val toNativeId = sourceModule?.getNativeId(event.to)
        val payload = mutableMapOf<String, Any?>().apply {
            putAll(event.toJson())
            put("nativeId", nativeId)
            put("name", "onPlaylistTransition")
            put("from", event.from.toJsonWithNativeId(fromNativeId))
            put("to", event.to.toJsonWithNativeId(toNativeId))
            put("fromSourceNativeId", fromNativeId)
            put("toSourceNativeId", toNativeId)
        }.filterNotNullValues()
        sendEvent("onPlaylistTransition", NonFiniteSanitizer.sanitizeEventData(payload))
    }

    private fun Source.toJsonWithNativeId(nativeId: NativeId?): Map<String, Any> = toJson().toMutableMap().apply {
        if (nativeId != null) put("nativeId", nativeId)
    }

    private fun Map<String, Any?>?.toPlaylistOptions(): PlaylistOptions {
        if (this == null) return PlaylistOptions()
        return PlaylistOptions(
            preloadAllSources = getBooleanOrNull("preloadAllSources") ?: false,
            replayMode = when (getString("replayMode")) {
                "lastSource" -> ReplayMode.LastSource
                else -> ReplayMode.Playlist
            },
        )
    }

    private fun Map<*, *>.toSeekTarget(): SeekTarget = SeekTarget(
        offset = (this["offset"] as? Number)?.toDouble() ?: 0.0,
        startOffsetTimelineReference = when (this["startOffsetTimelineReference"] as? String) {
            "start" -> TimelineReferencePoint.Start
            "end" -> TimelineReferencePoint.End
            else -> null
        },
    )

    private fun Map<String, Any?>.filterNotNullValues(): Map<String, Any> =
        filterValues { it != null }.mapValues { it.value!! }

    private fun setupImaBeforeInitialization(
        nativeId: NativeId,
        configJson: Map<String, Any?>?,
        playerConfig: PlayerConfig,
    ) {
        val advertisingConfigJson = configJson?.getMap("advertisingConfig") ?: return
        val imaJson = advertisingConfigJson.getMap("ima") ?: return
        if (!imaJson.containsKey("beforeInitialization")) {
            return
        }
        val advertisingConfig = playerConfig.advertisingConfig ?: AdvertisingConfig()
        val callback = createBeforeInitializationCallback(nativeId)
        val updatedIma = advertisingConfig.ima.copy(beforeInitialization = callback)
        playerConfig.advertisingConfig = advertisingConfig.copy(ima = updatedIma)
    }

    private fun setupShouldLoadAdItem(
        nativeId: NativeId,
        configJson: Map<String, Any?>?,
        playerConfig: PlayerConfig,
    ) {
        val advertisingConfigJson = configJson?.getMap("advertisingConfig") ?: return
        if (!advertisingConfigJson.containsKey("shouldLoadAdItem")) {
            return
        }
        val advertisingConfig = playerConfig.advertisingConfig ?: AdvertisingConfig()
        playerConfig.advertisingConfig = advertisingConfig.copy(
            shouldLoadAdItem = { adItem ->
                val (id, wait) = shouldLoadAdItemWaiter.make(250)
                sendEvent(
                    "onShouldLoadAdItem",
                    bundleOf(
                        "nativeId" to nativeId,
                        "id" to id,
                        "adItem" to adItem.toJson(),
                    ),
                )
                wait() ?: true
            },
        )
    }

    private fun setupShouldPlayAdBreak(
        nativeId: NativeId,
        configJson: Map<String, Any?>?,
        playerConfig: PlayerConfig,
    ) {
        val advertisingConfigJson = configJson?.getMap("advertisingConfig") ?: return
        if (!advertisingConfigJson.containsKey("shouldPlayAdBreak")) {
            return
        }
        val advertisingConfig = playerConfig.advertisingConfig ?: AdvertisingConfig()
        playerConfig.advertisingConfig = advertisingConfig.copy(
            shouldPlayAdBreak = { adBreak ->
                val (id, wait) = shouldPlayAdBreakWaiter.make(250)
                sendEvent(
                    "onShouldPlayAdBreak",
                    bundleOf(
                        "nativeId" to nativeId,
                        "id" to id,
                        "adBreak" to adBreak.toJson(),
                    ),
                )
                wait() ?: true
            },
        )
    }

    private fun createBeforeInitializationCallback(nativeId: NativeId): BeforeInitializationCallback =
        BeforeInitializationCallback { settings ->
            val (id, wait) = imaSettingsWaiter.make(250)
            val payload = settings.toMap()
            sendEvent(
                "onImaBeforeInitialization",
                bundleOf(
                    "nativeId" to nativeId,
                    "id" to id,
                    "settings" to payload,
                ),
            )
            wait()?.applyOnImaSettings(settings)
        }

    // CRITICAL: This method must remain available for cross-module access
    fun getPlayerOrNull(nativeId: NativeId): Player? = PlayerRegistry.getPlayer(nativeId)
}
