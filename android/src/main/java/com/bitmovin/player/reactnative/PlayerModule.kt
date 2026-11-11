package com.bitmovin.player.reactnative

import android.os.Handler
import android.os.Looper
import androidx.core.os.bundleOf
import com.bitmovin.analytics.api.DefaultMetadata
import com.bitmovin.player.api.Player
import com.bitmovin.player.api.PlayerConfig
import com.bitmovin.player.api.advertising.AdvertisingConfig
import com.bitmovin.player.api.analytics.AnalyticsApi.Companion.analytics
import com.bitmovin.player.api.analytics.create
import com.bitmovin.player.api.event.Event
import com.bitmovin.player.api.media.MediaType
import com.bitmovin.player.api.playlist.PlaylistConfig
import com.bitmovin.player.api.playlist.PlaylistOptions
import com.bitmovin.player.api.source.Source
import com.bitmovin.player.reactnative.offline.OfflineContentManagerBridge
import com.bitmovin.player.reactnative.converter.toAdItem
import com.bitmovin.player.reactnative.converter.toBufferTypeOrThrow
import com.bitmovin.player.reactnative.converter.toDecoderConfig
import com.bitmovin.player.reactnative.converter.toAnalyticsConfig
import com.bitmovin.player.reactnative.converter.toAnalyticsCustomData
import com.bitmovin.player.reactnative.converter.toAnalyticsDefaultMetadata
import com.bitmovin.player.reactnative.converter.toJson
import com.bitmovin.player.reactnative.converter.toMediaControlConfig
import com.bitmovin.player.reactnative.converter.toNetworkConfig
import com.bitmovin.player.reactnative.converter.toPlayerConfig
import com.bitmovin.player.reactnative.converter.toPlaylistOptions
import com.bitmovin.player.reactnative.extensions.getMap
import com.bitmovin.player.reactnative.util.NonFiniteSanitizer
import expo.modules.kotlin.functions.Queues
import expo.modules.kotlin.jni.JavaScriptFunction
import expo.modules.kotlin.jni.JavaScriptValue
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class PlayerModule : Module() {

    val mediaSessionPlaybackManager by lazy { MediaSessionPlaybackManager(appContext) }
    private val shouldLoadAdItemWaiter = ResultWaiter<Boolean>()
    private val shouldPlayAdBreakWaiter = ResultWaiter<Boolean>()
    private val imaSettingsWaiter = ResultWaiter<Map<String, Any?>>()

    private val eventRelay = EventRelay<Event>(PlayerEventTypes.player) { nativeId, eventName, event ->
        sendEvent(
            "onPlayerEvent",
            mapOf(
                "nativeId" to nativeId,
                "eventName" to eventName,
                "event" to NonFiniteSanitizer.sanitizeEventData(event.toJson()),
            ),
        )
    }

    override fun definition() = ModuleDefinition {
        Name("PlayerModule")

        AsyncFunction("getSharedPlayer") { nativeId: NativeId ->
            checkNotNull(PlayerRegistry.getSharedPlayer(nativeId)) { "Player has not been initialized" }
        }.runOnQueue(Queues.MAIN)

        Class(SharedPlayer::class) {
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
            AsyncFunction("loadSource") { shared: SharedPlayer, source: SharedSource ->
                shared.player.load(source.source)
            }.runOnQueue(Queues.MAIN)
            AsyncFunction("loadPlaylist") { shared: SharedPlayer, sources: List<SharedSource>,
                options: Map<String, Any?>?, ->
                shared.player.load(PlaylistConfig(sources.map { it.source }, options?.toPlaylistOptions() ?: PlaylistOptions()))
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
            AsyncFunction("scheduleAd") { shared: SharedPlayer, adItemJson: Map<String, Any> ->
                adItemJson.toAdItem()?.let { shared.player.scheduleAd(it) }
            }.runOnQueue(Queues.MAIN)

            AsyncFunction("loadOfflineContent") { shared: SharedPlayer, offline: OfflineContentManagerBridge,
                options: Map<String, Any>?, ->
                val config = offline.offlineContentManager.offlineSourceConfig ?: return@AsyncFunction false
                shared.player.load(config)
                true
            }.runOnQueue(Queues.MAIN)

            AsyncFunction("sendCustomDataEvent") { shared: SharedPlayer, json: Map<String, Any?> ->
                checkNotNull(shared.player.analytics) { "Analytics is disabled" }
                    .sendCustomDataEvent(json.toAnalyticsCustomData())
            }.runOnQueue(Queues.MAIN)

            AsyncFunction("getAnalyticsUserId") { shared: SharedPlayer ->
                checkNotNull(shared.player.analytics) { "Analytics is disabled" }.userId
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
        }

        OnCreate {
            // Module initialization
        }

        OnDestroy {
            // `OnDestroy` has no `runOnQueue` and is not guaranteed to run on the main thread, which the event relay
            // and the players require. Post to the main looper directly: Expo cancels its `mainQueue` right after
            // `OnDestroy`, which would drop a block launched on it.
            Handler(Looper.getMainLooper()).post {
                // Detach the listeners first, so destroying the players does not emit into this module.
                eventRelay.clear { PlayerRegistry.getPlayer(it) }
                PlayerRegistry.getAllNativeIds().forEach { PlayerRegistry.getSharedPlayer(it)?.closeCallbacks() }
                // Clean up all players when module is destroyed
                PlayerRegistry.getAllPlayers().forEach { player ->
                    try {
                        player.destroy()
                    } catch (e: Exception) {
                        // Log but don't crash on cleanup
                    }
                }
                PlayerRegistry.clear()
            }
            shouldLoadAdItemWaiter.clear()
            shouldPlayAdBreakWaiter.clear()
            imaSettingsWaiter.clear()
        }

        Events("onShouldLoadAdItem", "onShouldPlayAdBreak", "onImaBeforeInitialization", "onPlayerEvent")

        AsyncFunction("on") { nativeId: NativeId, eventName: String ->
            val player = PlayerRegistry.getPlayer(nativeId) ?: return@AsyncFunction
            eventRelay.on(nativeId, player, eventName)
        }.runOnQueue(Queues.MAIN)

        AsyncFunction("off") { nativeId: NativeId, eventName: String ->
            eventRelay.off(nativeId, PlayerRegistry.getPlayer(nativeId), eventName)
        }.runOnQueue(Queues.MAIN)

        Constant("isGoogleImaEnabled") { ImaBeforeInitializationConfigurator.IS_GOOGLE_IMA_ENABLED }

        AsyncFunction("destroy") { nativeId: NativeId ->
            val player = PlayerRegistry.getPlayer(nativeId)
            if (player != null) {
                PlayerRegistry.getSharedPlayer(nativeId)?.closeCallbacks()
                // Note: MediaSession cleanup would need to be handled here
                player.destroy()
                PlayerRegistry.unregister(nativeId)
            }
            eventRelay.offAll(nativeId, player)
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
            callback: JavaScriptFunction<JavaScriptValue>?, ->
            initializePlayer(nativeId, config, null, callback)
        }.runOnQueue(Queues.MAIN)

        AsyncFunction("initializeWithAnalyticsConfig") { nativeId: NativeId, analyticsConfigJson: Map<String, Any>,
            config: Map<String, Any>?, callback: JavaScriptFunction<JavaScriptValue>?, ->
            initializePlayer(nativeId, config, analyticsConfigJson, callback)
        }.runOnQueue(Queues.MAIN)

    }

    private fun initializePlayer(
        nativeId: NativeId,
        config: Map<String, Any>?,
        analyticsConfigJson: Map<String, Any>?,
        callback: JavaScriptFunction<JavaScriptValue>?,
    ): SharedPlayer {
        PlayerRegistry.getSharedPlayer(nativeId)?.let { return it }
        val callbacks = CallbackScope(appContext, callback)
        return callbacks.createSharedObject {
            val playerConfig = config?.toPlayerConfig() ?: PlayerConfig()
            @Suppress("UNCHECKED_CAST")
            val configJson = config as? Map<String, Any?>
            setupShouldLoadAdItem(nativeId, configJson, playerConfig)
            setupShouldPlayAdBreak(nativeId, configJson, playerConfig)
            ImaBeforeInitializationConfigurator.configure(
                nativeId = nativeId,
                configJson = configJson,
                playerConfig = playerConfig,
                imaSettingsWaiter = imaSettingsWaiter,
            ) { eventNativeId, id, payload ->
                sendEvent(
                    "onImaBeforeInitialization",
                    bundleOf(
                        "nativeId" to eventNativeId,
                        "id" to id,
                        "settings" to payload,
                    ),
                )
            }
            val enableMediaSession = config?.getMap("mediaControlConfig")
                ?.toMediaControlConfig()?.isEnabled ?: true

            config?.getMap("networkConfig")?.let { playerConfig.networkConfig = it.toNetworkConfig(callbacks) }

            val decoderConfig = config?.getMap("playbackConfig")?.getMap("decoderConfig").toDecoderConfig(callbacks)
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
            PlayerRegistry.register(player, nativeId, appContext, callbacks)

            try {
                if (enableMediaSession) mediaSessionPlaybackManager.setupMediaSessionPlayback(nativeId)
            } catch (error: Throwable) {
                PlayerRegistry.unregister(nativeId)
                player.destroy()
                throw error
            }
            checkNotNull(PlayerRegistry.getSharedPlayer(nativeId))
        }
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

    // CRITICAL: This method must remain available for cross-module access
    fun getPlayerOrNull(nativeId: NativeId): Player? = PlayerRegistry.getPlayer(nativeId)
}
