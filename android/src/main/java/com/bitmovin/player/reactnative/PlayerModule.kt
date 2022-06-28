package com.bitmovin.player.reactnative

import android.os.Handler
import android.os.Looper
import com.bitmovin.player.api.Player
import com.bitmovin.player.reactnative.converter.JsonConverter
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.module.annotations.ReactModule;

@ReactModule(name = PlayerModule.name)
class PlayerModule(private val context: ReactApplicationContext) : ReactContextBaseJavaModule(context) {
    /**
     * In-memory mapping of `id` <-> `Player`.
     */
    private var registry: MutableMap<String, PlayerContext> = mutableMapOf()

    /**
     * Exported module name to JS.
     */
    companion object {
        const val name = "PlayerModule"
    }
    override fun getName() = PlayerModule.name

    fun getPlayerContext(playerId: String?): PlayerContext? {
        if (playerId == null) {
            return null
        }
        return registry[playerId]
    }

    /**
     * Create a new `Player` instance for the given `config` if no one exists already.
     * @param config Player configuration options sent from JS.
     */
    @ReactMethod
    fun initWithConfig(config: ReadableMap) {
        onMainThread {
            val id = config.getString("id")
            if (id != null && !registry.containsKey(id)) {
                JsonConverter.toPlayerConfig(config)?.let {
                    registry[id] = PlayerContext(Player.create(context, it))
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
    fun load(playerId: String, config: ReadableMap) {
        onMainThread {
            JsonConverter.toSourceConfig(config)?.let {
                registry[playerId]?.load(it)
            }
        }
    }

    /**
     * Call `.play()` on `playerId`'s player.
     * @param playerId Target player Id.
     */
    @ReactMethod
    fun play(playerId: String) {
        onMainThread {
            registry[playerId]?.player?.play()
        }
    }

    /**
     * Resolve the source of `playerId`'s player.
     * @param playerId Target player Id.
     * @param promise JS promise object.
     */
    @ReactMethod
    fun getSource(playerId: String, promise: Promise) {
        onMainThread {
            promise.resolve(JsonConverter.fromSource(registry[playerId]?.player?.source))
        }
    }

    /**
     * Helper function that runs any arbitrary operation on main thread.
     */
    private fun onMainThread(runnable: Runnable) =
        Handler(Looper.getMainLooper()).post(runnable)
}