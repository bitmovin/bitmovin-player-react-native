package com.bitmovin.player.reactnative

import com.bitmovin.player.api.Player
import com.bitmovin.player.reactnative.converter.JsonConverter
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.module.annotations.ReactModule;
import com.facebook.react.uimanager.UIManagerModule
import java.util.UUID

@ReactModule(name = PlayerModule.name)
class PlayerModule(private val context: ReactApplicationContext) : ReactContextBaseJavaModule(context) {
    /**
     * In-memory mapping of `id` <-> `Player`.
     */
    private var registry: MutableMap<String, Player> = mutableMapOf()

    /**
     * Exported module name to JS.
     */
    companion object {
        const val name = "PlayerModule"
    }
    override fun getName() = PlayerModule.name

    /**
     * Fetch the `Player` instance with id equal to `playerId` inside this module's `registry`.
     * @param playerId Target player to look inside registry.
     */
    fun getPlayer(playerId: String?): Player? {
        if (playerId == null) {
            return null
        }
        return registry[playerId]
    }

    /**
     * Synchronously generate a random UUID for `Player`s native id when no `nativeId` is provided
     * by the user.
     * @return Random UUID RFC 4122 version 4.
     */
    @ReactMethod(isBlockingSynchronousMethod = true)
    fun generateUUIDv4(): String = UUID.randomUUID().toString()

    /**
     * Create a new `Player` instance for the given `config` if no one exists already.
     * @param config Player configuration options sent from JS.
     */
    @ReactMethod
    fun initWithConfig(playerId: String, config: ReadableMap?) {
        uiManager()?.addUIBlock {
            if (!registry.containsKey(playerId)) {
                JsonConverter.toPlayerConfig(config)?.let {
                    registry[playerId] = Player.create(context, it)
                }
            }
        }
    }

    /**
     * Load the source of the given `playerId` with `config` options from JS.
     * @param playerId Target player.
     * @param config Source configuration options from JS.
     */
    @ReactMethod
    fun loadSource(playerId: String, config: ReadableMap?) {
        uiManager()?.addUIBlock {
            JsonConverter.toSourceConfig(config)?.let {
                registry[playerId]?.load(it)
            }
        }
    }

    /**
     * Call `.unload()` on `playerId`'s player.
     * @param playerId Target player Id.
     */
    @ReactMethod
    fun unload(playerId: String) {
        uiManager()?.addUIBlock {
            registry[playerId]?.unload()
        }
    }

    /**
     * Call `.play()` on `playerId`'s player.
     * @param playerId Target player Id.
     */
    @ReactMethod
    fun play(playerId: String) {
        uiManager()?.addUIBlock {
            registry[playerId]?.play()
        }
    }

    /**
     * Call `.pause()` on `playerId`'s player.
     * @param playerId Target player Id.
     */
    @ReactMethod
    fun pause(playerId: String) {
        uiManager()?.addUIBlock {
            registry[playerId]?.pause()
        }
    }

    /**
     * Call `.seek(time:)` on `playerId`'s player.
     * @param playerId Target player Id.
     * @param time Seek time in seconds.
     */
    @ReactMethod
    fun seek(playerId: String, time: Double) {
        uiManager()?.addUIBlock {
            registry[playerId]?.seek(time)
        }
    }

    /**
     * Call `.mute()` on `playerId`'s player.
     * @param playerId Target player Id.
     */
    @ReactMethod
    fun mute(playerId: String) {
        uiManager()?.addUIBlock {
            registry[playerId]?.mute()
        }
    }

    /**
     * Call `.unmute()` on `playerId`'s player.
     * @param playerId Target player Id.
     */
    @ReactMethod
    fun unmute(playerId: String) {
        uiManager()?.addUIBlock {
            registry[playerId]?.unmute()
        }
    }

    /**
     * Call `.destroy()` on `playerId`'s player.
     * @param playerId Target player Id.
     */
    @ReactMethod
    fun destroy(playerId: String) {
        uiManager()?.addUIBlock {
            registry[playerId]?.let {
                it.destroy()
                registry.remove(playerId)
            }
        }
    }

    /**
     * Call `.setVolume(volume:)` on `playerId`'s player.
     * @param playerId Target player Id.
     * @param volume Volume level integer between 0 to 100.
     */
    @ReactMethod
    fun setVolume(playerId: String, volume: Int) {
        uiManager()?.addUIBlock {
            registry[playerId]?.volume = volume
        }
    }

    /**
     * Resolve `playerId`'s current volume.
     * @param playerId Target player Id.
     * @param promise JS promise object.
     */
    @ReactMethod
    fun getVolume(playerId: String, promise: Promise) {
        uiManager()?.addUIBlock {
            promise.resolve(registry[playerId]?.volume)
        }
    }

    /**
     * Resolve the source of `playerId`'s player.
     * @param playerId Target player Id.
     * @param promise JS promise object.
     */
    @ReactMethod
    fun source(playerId: String, promise: Promise) {
        uiManager()?.addUIBlock {
            promise.resolve(JsonConverter.fromSource(registry[playerId]?.source))
        }
    }

    /**
     * Resolve `playerId`'s current playback time.
     * @param playerId Target player Id.
     * @param promise JS promise object.
     */
    @ReactMethod
    fun currentTime(playerId: String, mode: String?, promise: Promise) {
        uiManager()?.addUIBlock {
            var timeOffset: Double = 0.0
            if (mode != null) {
                timeOffset = if (mode == "relative") {
                    registry[playerId]?.playbackTimeOffsetToRelativeTime ?: 0.0
                } else {
                    registry[playerId]?.playbackTimeOffsetToAbsoluteTime ?: 0.0
                }
            }
            val currentTime = registry[playerId]?.currentTime
            if (currentTime != null) {
                promise.resolve(currentTime + timeOffset)
            }
        }
    }

    /**
     * Resolve `playerId`'s current source duration.
     * @param playerId Target player Id.
     * @param promise JS promise object.
     */
    @ReactMethod
    fun duration(playerId: String, promise: Promise) {
        uiManager()?.addUIBlock {
            promise.resolve(registry[playerId]?.duration)
        }
    }

    /**
     * Resolve `playerId`'s current muted state.
     * @param playerId Target player Id.
     * @param promise JS promise object.
     */
    @ReactMethod
    fun isMuted(playerId: String, promise: Promise) {
        uiManager()?.addUIBlock {
            promise.resolve(registry[playerId]?.isMuted)
        }
    }

    /**
     * Resolve `playerId`'s current playing state.
     * @param playerId Target player Id.
     * @param promise JS promise object.
     */
    @ReactMethod
    fun isPlaying(playerId: String, promise: Promise) {
        uiManager()?.addUIBlock {
            promise.resolve(registry[playerId]?.isPlaying)
        }
    }

    /**
     * Resolve `playerId`'s current paused state.
     * @param playerId Target player Id.
     * @param promise JS promise object.
     */
    @ReactMethod
    fun isPaused(playerId: String, promise: Promise) {
        uiManager()?.addUIBlock {
            promise.resolve(registry[playerId]?.isPaused)
        }
    }

    /**
     * Resolve `playerId`'s current live state.
     * @param playerId Target player Id.
     * @param promise JS promise object.
     */
    @ReactMethod
    fun isLive(playerId: String, promise: Promise) {
        uiManager()?.addUIBlock {
            promise.resolve(registry[playerId]?.isLive)
        }
    }

    /**
     * Helper function that returns the initialized `UIManager` instance.
     */
    private fun uiManager(): UIManagerModule? =
        context.getNativeModule(UIManagerModule::class.java)
}