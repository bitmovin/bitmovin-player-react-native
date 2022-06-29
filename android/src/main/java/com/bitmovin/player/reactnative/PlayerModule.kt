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
     * Create a new `Player` instance for the given `config` if no one exists already.
     * @param config Player configuration options sent from JS.
     */
    @ReactMethod
    fun initWithConfig(config: ReadableMap) {
        uiManager()?.addUIBlock {
            val id = config.getString("id")
            if (id != null && !registry.containsKey(id)) {
                JsonConverter.toPlayerConfig(config)?.let {
                    registry[id] = Player.create(context, it)
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
    fun loadSource(playerId: String, config: ReadableMap) {
        uiManager()?.addUIBlock {
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
        uiManager()?.addUIBlock {
            registry[playerId]?.play()
        }
    }

    /**
     * Resolve the source of `playerId`'s player.
     * @param playerId Target player Id.
     * @param promise JS promise object.
     */
    @ReactMethod
    fun getSource(playerId: String, promise: Promise) {
        uiManager()?.addUIBlock {
            promise.resolve(JsonConverter.fromSource(registry[playerId]?.source))
        }
    }

    /**
     * Helper function that returns the initialized `UIManager` instance.
     */
    private fun uiManager(): UIManagerModule? =
        context.getNativeModule(UIManagerModule::class.java)
}