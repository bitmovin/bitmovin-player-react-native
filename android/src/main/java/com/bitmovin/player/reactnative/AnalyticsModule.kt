package com.bitmovin.player.reactnative

import com.bitmovin.analytics.bitmovin.player.BitmovinPlayerCollector
import com.bitmovin.player.reactnative.converter.JsonConverter
import com.facebook.react.bridge.*
import com.facebook.react.module.annotations.ReactModule
import com.facebook.react.uimanager.UIManagerModule

private const val MODULE_NAME = "AnalyticsModule"

@ReactModule(name = MODULE_NAME)
class AnalyticsModule(private val context: ReactApplicationContext) : ReactContextBaseJavaModule(context) {
    /**
     * In-memory mapping from `nativeId`s to `BitmovinPlayerCollector` instances.
     */
    private val collectors: Registry<BitmovinPlayerCollector> = mutableMapOf()

    /**
     * JS exported module name.
     */
    override fun getName() = MODULE_NAME

    /**
     * Fetches the `BitmovinPlayerCollector` instance associated with `nativeId` from the internal registry.
     * @param nativeId `BitmovinPlayerCollector` instance ID.
     * @return The associated `BitmovinPlayerCollector` instance or `null`.
     */
    fun getCollector(nativeId: NativeId?): BitmovinPlayerCollector? {
        if (nativeId == null) {
            return null
        }
        return collectors[nativeId]
    }

    /**
     * Creates a new `BitmovinPlayerCollector` instance inside the internal registry using the provided `config` object.
     * @param config `BitmovinAnalyticsConfig` object received from JS.
     */
    @ReactMethod
    fun initWithConfig(nativeId: NativeId, config: ReadableMap?) {
        uiManager()?.addUIBlock { _ ->
            JsonConverter.toAnalyticsConfig(config)?.let {
                collectors[nativeId] = BitmovinPlayerCollector(it, context)
            }
        }
    }

    /**
     * Detaches and removes the given `BitmovinPlayerCollector` from the internal registry.
     * @param nativeId Native Id of the collector instance.
     */
    @ReactMethod
    fun destroy(nativeId: NativeId) {
        uiManager()?.addUIBlock {
            if (collectors.containsKey(nativeId)) {
                collectors[nativeId]?.detachPlayer()
                collectors.remove(nativeId)
            }
        }
    }

    /**
     * Attaches a `BitmovinPlayerCollector` to the `Player` instance with native Id equal to `playerId`.
     * @param nativeId Native Id of the collector instance.
     * @param playerId Native Id of the player instance.
     */
    @ReactMethod
    fun attach(nativeId: NativeId, playerId: NativeId) {
        uiManager()?.addUIBlock { _ ->
            playerModule()?.getPlayer(playerId)?.let {
                collectors[nativeId]?.attachPlayer(it)
            }
        }
    }

    /**
     * Detaches the player object from a `BitmovinPlayerCollector` instance.
     * @param nativeId Native Id of the collector instance.
     */
    @ReactMethod
    fun detach(nativeId: NativeId) {
        uiManager()?.addUIBlock { _ ->
            collectors[nativeId]?.detachPlayer()
        }
    }

    /**
     * Updates the custom data config for a `BitmovinPlayerCollector` instance.
     * @param nativeId Native Id of the collector instance.
     * @param json Custom data config json.
     */
    @ReactMethod
    fun setCustomDataOnce(nativeId: NativeId, json: ReadableMap?) {
        uiManager()?.addUIBlock { _ ->
            JsonConverter.toAnalyticsCustomData(json)?.let {
                collectors[nativeId]?.setCustomDataOnce(it)
            }
        }
    }

    /**
     * Sets the custom data config for a `BitmovinPlayerCollector` instance.
     * @param nativeId Native Id of the collector instance.
     * @param json Custom data config json.
     */
    @ReactMethod
    fun setCustomData(nativeId: NativeId, playerId: NativeId?, json: ReadableMap?) {
        uiManager()?.addUIBlock { _ ->
            JsonConverter.toAnalyticsCustomData(json)?.let {
                collectors[nativeId]?.customData = it
            }
        }
    }

    /**
     * Gets the current custom data config for a `BitmovinPlayerCollector` instance.
     * @param nativeId Native Id of the the collector instance.
     * @param promise JS promise object.
     */
    @ReactMethod
    fun getCustomData(nativeId: NativeId, playerId: NativeId?, promise: Promise) {
        uiManager()?.addUIBlock { _ ->
            collectors[nativeId]?.let {
                promise.resolve(JsonConverter.fromAnalyticsCustomData(it.customData))
            }
        }
    }

    @ReactMethod
    fun addSourceMetadata(nativeId: NativeId, playerId: NativeId?, json: ReadableMap?) {
        uiManager()?.addUIBlock { _ ->
            playerModule()?.getPlayer(playerId)?.source?.let { playerSource ->
                JsonConverter.toAnalyticsSourceMetadata(json)?.let { sourceMetadata ->
                    collectors[nativeId]?.addSourceMetadata(playerSource, sourceMetadata)
                }
            }
        }
    }

    /**
     * Gets the current user Id for a `BitmovinPlayerCollector` instance.
     * @param nativeId Native Id of the the collector instance.
     * @param promise JS promise object.
     */
    @ReactMethod
    fun getUserId(nativeId: NativeId, promise: Promise) {
        uiManager()?.addUIBlock { _ ->
            collectors[nativeId]?.let {
                promise.resolve(it.userId)
            }
        }
    }

    /**
     * Helper function that gets the instantiated `UIManagerModule` from modules registry.
     */
    private fun uiManager(): UIManagerModule? =
        context.getNativeModule(UIManagerModule::class.java)

    /**
     * Helper function that gets the instantiated `PlayerModule` from modules registry.
     */
    private fun playerModule(): PlayerModule? =
        context.getNativeModule(PlayerModule::class.java)
}
