package com.bitmovin.player.reactnative

import com.bitmovin.player.api.analytics.AnalyticsApi.Companion.analytics
import com.bitmovin.player.api.media.MediaType
import com.bitmovin.player.reactnative.converter.toAdItem
import com.bitmovin.player.reactnative.converter.toAnalyticsCustomData
import com.bitmovin.player.reactnative.converter.toBufferTypeOrThrow
import com.bitmovin.player.reactnative.converter.toJson
import com.bitmovin.player.reactnative.offline.OfflineContentManagerBridge
import expo.modules.kotlin.Promise
import expo.modules.kotlin.functions.Queues
import expo.modules.kotlin.jni.JavaScriptFunction
import expo.modules.kotlin.jni.JavaScriptValue
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class PlayerModule : Module() {
    private val mediaSessionPlaybackManager by lazy { MediaSessionPlaybackManager(appContext) }

    override fun definition() = ModuleDefinition {
        Name("PlayerModule")
        Constant("isGoogleImaEnabled") { ImaBeforeInitializationConfigurator.IS_GOOGLE_IMA_ENABLED }
        Function("createEmpty") { SharedPlayer.empty(appContext, mediaSessionPlaybackManager) }
        AsyncFunction("create") { config: Map<String, Any>?, analytics: Map<String, Any>?,
            network: SharedNetwork?, decoder: SharedDecoder?, callback: JavaScriptFunction<JavaScriptValue>?, ->
            SharedPlayer.create(appContext, config, analytics, network, decoder, callback, mediaSessionPlaybackManager)
        }.runOnQueue(Queues.MAIN)

        Class(SharedPlayer::class) {
            Constructor { SharedPlayer.empty(appContext, mediaSessionPlaybackManager) }
            AsyncFunction("getBufferLevel") { shared: SharedPlayer, type: String ->
                shared.player?.buffer?.let { buffer ->
                    type.toBufferTypeOrThrow().let { bufferType ->
                        mapOf(
                            "audio" to buffer.getLevel(bufferType, MediaType.Audio).toJson(),
                            "video" to buffer.getLevel(bufferType, MediaType.Video).toJson(),
                        )
                    }
                }
            }.runOnQueue(Queues.MAIN)

            AsyncFunction("setBufferTargetLevel") { shared: SharedPlayer, type: String, value: Double ->
                shared.player?.buffer?.setTargetLevel(type.toBufferTypeOrThrow(), value)
            }.runOnQueue(Queues.MAIN)

            AsyncFunction("sendCustomDataEvent") { shared: SharedPlayer, json: Map<String, Any?>, promise: Promise ->
                try {
                    (
                        checkNotNull(shared.player) { "Player is not initialized" }.analytics
                            ?: error("Analytics is disabled")
                        ).sendCustomDataEvent(json.toAnalyticsCustomData())
                    promise.resolve(null)
                } catch (e: Exception) {
                    promise.reject("PlayerAnalyticsError", "Failed to send custom data event", e)
                }
            }.runOnQueue(Queues.MAIN)

            AsyncFunction("getAnalyticsUserId") { shared: SharedPlayer, promise: Promise ->
                try {
                    promise.resolve(
                        (
                            checkNotNull(shared.player) { "Player is not initialized" }.analytics
                                ?: error("Analytics is disabled")
                            ).userId,
                    )
                } catch (e: Exception) {
                    promise.reject("PlayerAnalyticsError", "Failed to get user ID", e)
                }
            }.runOnQueue(Queues.MAIN)

            AsyncFunction("play") { shared: SharedPlayer ->
                shared.player?.play()
            }.runOnQueue(Queues.MAIN)

            AsyncFunction("pause") { shared: SharedPlayer ->
                shared.player?.pause()
            }.runOnQueue(Queues.MAIN)

            AsyncFunction("mute") { shared: SharedPlayer ->
                shared.player?.mute()
            }.runOnQueue(Queues.MAIN)

            AsyncFunction("unmute") { shared: SharedPlayer ->
                shared.player?.unmute()
            }.runOnQueue(Queues.MAIN)

            AsyncFunction("seek") { shared: SharedPlayer, time: Double ->
                shared.player?.seek(time)
            }.runOnQueue(Queues.MAIN)

            AsyncFunction("timeShift") { shared: SharedPlayer, offset: Double ->
                shared.player?.timeShift(offset)
            }.runOnQueue(Queues.MAIN)

            AsyncFunction("destroy") { shared: SharedPlayer ->
                shared.destroy()
            }.runOnQueue(Queues.MAIN)

            AsyncFunction("setVolume") { shared: SharedPlayer, volume: Double ->
                shared.player?.volume = volume.toInt()
            }.runOnQueue(Queues.MAIN)

            AsyncFunction("getVolume") { shared: SharedPlayer ->
                return@AsyncFunction shared.player?.volume?.toDouble()
            }.runOnQueue(Queues.MAIN)

            AsyncFunction("currentTime") { shared: SharedPlayer, mode: String? ->
                shared.player?.let {
                    when (mode) {
                        "relative" -> it.currentTime + it.playbackTimeOffsetToRelativeTime
                        "absolute" -> it.currentTime + it.playbackTimeOffsetToAbsoluteTime
                        else -> it.currentTime
                    }
                }
            }.runOnQueue(Queues.MAIN)

            AsyncFunction("isPlaying") { shared: SharedPlayer ->
                return@AsyncFunction shared.player?.isPlaying
            }.runOnQueue(Queues.MAIN)

            AsyncFunction("isPaused") { shared: SharedPlayer ->
                return@AsyncFunction shared.player?.isPaused
            }.runOnQueue(Queues.MAIN)

            AsyncFunction("duration") { shared: SharedPlayer ->
                return@AsyncFunction shared.player?.duration
            }.runOnQueue(Queues.MAIN)

            AsyncFunction("isMuted") { shared: SharedPlayer ->
                return@AsyncFunction shared.player?.isMuted
            }.runOnQueue(Queues.MAIN)

            AsyncFunction("unload") { shared: SharedPlayer ->
                shared.player?.unload()
            }.runOnQueue(Queues.MAIN)

            AsyncFunction("getTimeShift") { shared: SharedPlayer ->
                return@AsyncFunction shared.player?.timeShift
            }.runOnQueue(Queues.MAIN)

            AsyncFunction("isLive") { shared: SharedPlayer ->
                return@AsyncFunction shared.player?.isLive
            }.runOnQueue(Queues.MAIN)

            AsyncFunction("getMaxTimeShift") { shared: SharedPlayer ->
                return@AsyncFunction shared.player?.maxTimeShift
            }.runOnQueue(Queues.MAIN)

            AsyncFunction("getPlaybackSpeed") { shared: SharedPlayer ->
                return@AsyncFunction shared.player?.playbackSpeed?.toDouble()
            }.runOnQueue(Queues.MAIN)

            AsyncFunction("setPlaybackSpeed") { shared: SharedPlayer, playbackSpeed: Double ->
                shared.player?.playbackSpeed = playbackSpeed.toFloat()
            }.runOnQueue(Queues.MAIN)

            AsyncFunction("isAd") { shared: SharedPlayer ->
                return@AsyncFunction shared.player?.isAd
            }.runOnQueue(Queues.MAIN)

            AsyncFunction("setMaxSelectableBitrate") { shared: SharedPlayer, maxBitrate: Double ->
                shared.player?.setMaxSelectableVideoBitrate(maxBitrate.toInt())
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
                return@AsyncFunction shared.player?.isCastAvailable
            }.runOnQueue(Queues.MAIN)

            AsyncFunction("isCasting") { shared: SharedPlayer ->
                return@AsyncFunction shared.player?.isCasting
            }.runOnQueue(Queues.MAIN)

            AsyncFunction("castVideo") { shared: SharedPlayer ->
                shared.player?.castVideo()
            }.runOnQueue(Queues.MAIN)

            AsyncFunction("castStop") { shared: SharedPlayer ->
                shared.player?.castStop()
            }.runOnQueue(Queues.MAIN)

            AsyncFunction("skipAd") { shared: SharedPlayer ->
                shared.player?.skipAd()
            }.runOnQueue(Queues.MAIN)

            AsyncFunction("canPlayAtPlaybackSpeed") { _: SharedPlayer, _: Double ->
                // This method is iOS-only, return false on Android
                false
            }.runOnQueue(Queues.MAIN)

            AsyncFunction("getAudioTrack") { shared: SharedPlayer ->
                return@AsyncFunction shared.player?.source?.selectedAudioTrack?.toJson()
            }.runOnQueue(Queues.MAIN)

            AsyncFunction("getAvailableAudioTracks") { shared: SharedPlayer ->
                return@AsyncFunction shared.player?.source?.availableAudioTracks?.map { it.toJson() } ?: emptyList()
            }.runOnQueue(Queues.MAIN)

            AsyncFunction("setAudioTrack") { shared: SharedPlayer, trackIdentifier: String ->
                shared.player?.source?.setAudioTrack(trackIdentifier)
            }.runOnQueue(Queues.MAIN)

            AsyncFunction("getSubtitleTrack") { shared: SharedPlayer ->
                return@AsyncFunction shared.player?.source?.selectedSubtitleTrack?.toJson()
            }.runOnQueue(Queues.MAIN)

            AsyncFunction("getAvailableSubtitles") { shared: SharedPlayer ->
                return@AsyncFunction shared.player?.source?.availableSubtitleTracks?.map { it.toJson() } ?: emptyList()
            }.runOnQueue(Queues.MAIN)

            AsyncFunction("setSubtitleTrack") { shared: SharedPlayer, trackIdentifier: String? ->
                shared.player?.source?.setSubtitleTrack(trackIdentifier)
            }.runOnQueue(Queues.MAIN)

            AsyncFunction("getVideoQuality") { shared: SharedPlayer ->
                return@AsyncFunction shared.player?.videoQuality?.toJson()
            }.runOnQueue(Queues.MAIN)

            AsyncFunction("getAvailableVideoQualities") { shared: SharedPlayer ->
                return@AsyncFunction shared.player?.availableVideoQualities?.map { it.toJson() } ?: emptyList()
            }.runOnQueue(Queues.MAIN)

            AsyncFunction("setVideoQuality") { shared: SharedPlayer, qualityId: String ->
                shared.player?.source?.setVideoQuality(qualityId)
            }.runOnQueue(Queues.MAIN)

            AsyncFunction("getThumbnail") { shared: SharedPlayer, time: Double ->
                return@AsyncFunction shared.player?.getThumbnail(time)?.toJson()
            }.runOnQueue(Queues.MAIN)
            AsyncFunction("loadOfflineContent") { shared: SharedPlayer, offline: OfflineContentManagerBridge,
                options: Map<String, Any>?, ->
                offline.offlineContentManager.offlineSourceConfig?.let { shared.player?.load(it) }
            }.runOnQueue(Queues.MAIN)

            AsyncFunction("scheduleAd") { shared: SharedPlayer, adItemJson: Map<String, Any> ->
                adItemJson.toAdItem()?.let { shared.player?.scheduleAd(it) }
            }.runOnQueue(Queues.MAIN)

            AsyncFunction("loadSource") { shared: SharedPlayer, sharedSource: SharedSource ->
                sharedSource.source?.let { shared.player?.load(it) }
            }.runOnQueue(Queues.MAIN)

            AsyncFunction("source") { shared: SharedPlayer ->
                return@AsyncFunction shared.player?.source?.toJson()
            }.runOnQueue(Queues.MAIN)
        }
    }
}
