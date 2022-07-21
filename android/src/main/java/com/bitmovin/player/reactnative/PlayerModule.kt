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
     * In-memory mapping of `nativeId` strings and `Player` instances.
     */
    private var registry: MutableMap<String, Player> = mutableMapOf()

    /**
     * JS exported module name.
     */
    companion object {
        const val name = "PlayerModule"
    }
    override fun getName() = PlayerModule.name

    /**
     * Fetches the `Player` instance associated with `nativeId` from the internal registry.
     * @param nativeId `Player` instance ID.
     * @return The associated `Player` instance or `null`.
     */
    fun getPlayer(nativeId: String?): Player? {
        if (nativeId == null) {
            return null
        }
        return registry[nativeId]
    }

    /**
     * Creates a new `Player` instance inside the internal registry using the provided `config` object.
     * @param config `PlayerConfig` object received from JS.
     */
    @ReactMethod
    fun initWithConfig(nativeId: String, config: ReadableMap?) {
        uiManager()?.addUIBlock {
            if (!registry.containsKey(nativeId)) {
                JsonConverter.toPlayerConfig(config)?.let {
                    registry[nativeId] = Player.create(context, it)
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
    fun loadSource(nativeId: String, sourceNativeId: String) {
        uiManager()?.addUIBlock {
            sourceModule()?.getSource(sourceNativeId)?.let {
                registry[nativeId]?.load(it)
            }
        }
    }

    /**
     * Call `.unload()` on `nativeId`'s player.
     * @param nativeId Target player Id.
     */
    @ReactMethod
    fun unload(nativeId: String) {
        uiManager()?.addUIBlock {
            registry[nativeId]?.unload()
        }
    }

    /**
     * Call `.play()` on `nativeId`'s player.
     * @param nativeId Target player Id.
     */
    @ReactMethod
    fun play(nativeId: String) {
        uiManager()?.addUIBlock {
            registry[nativeId]?.play()
        }
    }

    /**
     * Call `.pause()` on `nativeId`'s player.
     * @param nativeId Target player Id.
     */
    @ReactMethod
    fun pause(nativeId: String) {
        uiManager()?.addUIBlock {
            registry[nativeId]?.pause()
        }
    }

    /**
     * Call `.seek(time:)` on `nativeId`'s player.
     * @param nativeId Target player Id.
     * @param time Seek time in seconds.
     */
    @ReactMethod
    fun seek(nativeId: String, time: Double) {
        uiManager()?.addUIBlock {
            registry[nativeId]?.seek(time)
        }
    }

    /**
     * Call `.mute()` on `nativeId`'s player.
     * @param nativeId Target player Id.
     */
    @ReactMethod
    fun mute(nativeId: String) {
        uiManager()?.addUIBlock {
            registry[nativeId]?.mute()
        }
    }

    /**
     * Call `.unmute()` on `nativeId`'s player.
     * @param nativeId Target player Id.
     */
    @ReactMethod
    fun unmute(nativeId: String) {
        uiManager()?.addUIBlock {
            registry[nativeId]?.unmute()
        }
    }

    /**
     * Call `.destroy()` on `nativeId`'s player.
     * @param nativeId Target player Id.
     */
    @ReactMethod
    fun destroy(nativeId: String) {
        uiManager()?.addUIBlock {
            registry[nativeId]?.let {
                it.destroy()
                registry.remove(nativeId)
            }
        }
    }

    /**
     * Call `.setVolume(volume:)` on `nativeId`'s player.
     * @param nativeId Target player Id.
     * @param volume Volume level integer between 0 to 100.
     */
    @ReactMethod
    fun setVolume(nativeId: String, volume: Int) {
        uiManager()?.addUIBlock {
            registry[nativeId]?.volume = volume
        }
    }

    /**
     * Resolve `nativeId`'s current volume.
     * @param nativeId Target player Id.
     * @param promise JS promise object.
     */
    @ReactMethod
    fun getVolume(nativeId: String, promise: Promise) {
        uiManager()?.addUIBlock {
            promise.resolve(registry[nativeId]?.volume)
        }
    }

    /**
     * Resolve the source of `nativeId`'s player.
     * @param nativeId Target player Id.
     * @param promise JS promise object.
     */
    @ReactMethod
    fun source(nativeId: String, promise: Promise) {
        uiManager()?.addUIBlock {
            promise.resolve(JsonConverter.fromSource(registry[nativeId]?.source))
        }
    }

    /**
     * Resolve `nativeId`'s current playback time.
     * @param nativeId Target player Id.
     * @param promise JS promise object.
     */
    @ReactMethod
    fun currentTime(nativeId: String, mode: String?, promise: Promise) {
        uiManager()?.addUIBlock {
            var timeOffset: Double = 0.0
            if (mode != null) {
                timeOffset = if (mode == "relative") {
                    registry[nativeId]?.playbackTimeOffsetToRelativeTime ?: 0.0
                } else {
                    registry[nativeId]?.playbackTimeOffsetToAbsoluteTime ?: 0.0
                }
            }
            val currentTime = registry[nativeId]?.currentTime
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
    fun duration(nativeId: String, promise: Promise) {
        uiManager()?.addUIBlock {
            promise.resolve(registry[nativeId]?.duration)
        }
    }

    /**
     * Resolve `nativeId`'s current muted state.
     * @param nativeId Target player Id.
     * @param promise JS promise object.
     */
    @ReactMethod
    fun isMuted(nativeId: String, promise: Promise) {
        uiManager()?.addUIBlock {
            promise.resolve(registry[nativeId]?.isMuted)
        }
    }

    /**
     * Resolve `nativeId`'s current playing state.
     * @param nativeId Target player Id.
     * @param promise JS promise object.
     */
    @ReactMethod
    fun isPlaying(nativeId: String, promise: Promise) {
        uiManager()?.addUIBlock {
            promise.resolve(registry[nativeId]?.isPlaying)
        }
    }

    /**
     * Resolve `nativeId`'s current paused state.
     * @param nativeId Target player Id.
     * @param promise JS promise object.
     */
    @ReactMethod
    fun isPaused(nativeId: String, promise: Promise) {
        uiManager()?.addUIBlock {
            promise.resolve(registry[nativeId]?.isPaused)
        }
    }

    /**
     * Resolve `nativeId`'s current live state.
     * @param nativeId Target player Id.
     * @param promise JS promise object.
     */
    @ReactMethod
    fun isLive(nativeId: String, promise: Promise) {
        uiManager()?.addUIBlock {
            promise.resolve(registry[nativeId]?.isLive)
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
