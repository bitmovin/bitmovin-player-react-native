package com.bitmovin.player.reactnative

import com.bitmovin.player.api.Player
import com.bitmovin.player.reactnative.converter.JsonConverter
import com.facebook.react.bridge.*
import com.facebook.react.module.annotations.ReactModule
import com.facebook.react.uimanager.UIManagerModule

@ReactModule(name = PlayerModule.name)
class PlayerModule(private val context: ReactApplicationContext) : ReactContextBaseJavaModule(context) {
    /**
     * In-memory mapping from `nativeId`s to `Player` instances.
     */
    private val players: Registry<Player> = mutableMapOf()

    /**
     * JS exported module name.
     */
    companion object {
        const val name = "PlayerModule"
    }
    override fun getName() = PlayerModule.name

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
                JsonConverter.toPlayerConfig(config)?.let {
                    players[nativeId] = Player.create(context, it)
                }
            }
        }
    }

    /**
     * Load the source of the given `nativeId` with `config` options from JS.
     * @param nativeId Target player.
     * @param config Source configuration options from JS.
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
     * Helper function that returns the initialized `UIManager` instance.
     */
    private fun uiManager(): UIManagerModule? =
        context.getNativeModule(UIManagerModule::class.java)

    /**
     * Helper function that returns the initialized `SourceModule` instance.
     */
    private fun sourceModule(): SourceModule? =
        context.getNativeModule(SourceModule::class.java)
}
