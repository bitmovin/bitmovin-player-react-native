package com.bitmovin.player.reactnative

import android.util.Log
import com.bitmovin.analytics.bitmovin.player.api.IBitmovinPlayerCollector
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
    private val collectors: Registry<IBitmovinPlayerCollector> = mutableMapOf()

    /**
     * JS exported module name.
     */
    override fun getName() = MODULE_NAME

    /**
     * Fetches the `BitmovinPlayerCollector` instance associated with `nativeId` from the internal registry.
     * @param nativeId `BitmovinPlayerCollector` instance ID.
     * @return The associated `BitmovinPlayerCollector` instance or `null`.
     */
    fun getCollector(nativeId: NativeId?): IBitmovinPlayerCollector? {
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
                collectors[nativeId] = IBitmovinPlayerCollector.create(it, context)
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
    @Deprecated("Confusing API naming", replaceWith = ReplaceWith("sendCustomDataEvent(nativeId, json)"))
    @ReactMethod
    fun setCustomDataOnce(nativeId: NativeId, json: ReadableMap?) {
        uiManager()?.addUIBlock { _ ->
            JsonConverter.toAnalyticsCustomData(json)?.let {
                collectors[nativeId]?.setCustomDataOnce(it)
            }
        }
    }

    /**
     * Sends a sample with the provided custom data.
     * Does not change the configured custom data of the collector or source.
     * @param nativeId Native Id of the collector instance.
     * @param json Custom data config json.
     */
    @ReactMethod
    fun sendCustomDataEvent(nativeId: NativeId, json: ReadableMap?) {
        uiManager()?.addUIBlock { _ ->
            JsonConverter.toAnalyticsCustomData(json)?.let {
                collectors[nativeId]?.sendCustomDataEvent(it)
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
            val source = playerModule()?.getPlayer(playerId)?.source
            val collector = collectors[nativeId]
            val customData = JsonConverter.toAnalyticsCustomData(json)
            when {
                source == null -> Log.d(
                    "[AnalyticsModule]", "Could not find source for player ($playerId)"
                )
                collector == null -> Log.d(
                    "[AnalyticsModule]", "Could not find analytics collector ($nativeId)"
                )
                customData == null -> Log.d(
                    "[AnalyticsModule]", "Could not convert custom data, thus they are not applied to the active source for the player ($playerId) with the collector ($nativeId)"
                )
                else -> collector.setCustomData(source,  customData)
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
            val source = playerModule()?.getPlayer(playerId)?.source
            val collector = collectors[nativeId]
            when {
                source == null -> promise.reject(
                    "[AnalyticsModule]", "Could not find source for player ($playerId)"
                )
                collector == null -> promise.reject(
                    "[AnalyticsModule]", "Could not find analytics collector ($nativeId)"
                )
                else -> promise.resolve(JsonConverter.fromAnalyticsCustomData(collector.getCustomData(source)))
            }
        }
    }

    @ReactMethod
    fun addSourceMetadata(nativeId: NativeId, playerId: NativeId?, json: ReadableMap?) {
        uiManager()?.addUIBlock { _ ->
            val source = playerModule()?.getPlayer(playerId)?.source
            val collector = collectors[nativeId]
            val sourceMetadata = JsonConverter.toAnalyticsSourceMetadata(json)
            when {
                source == null -> Log.d(
                    "[AnalyticsModule]", "Could not find source for player ($playerId)"
                )
                collector == null -> Log.d(
                    "[AnalyticsModule]", "Could not find analytics collector ($nativeId)"
                )
                sourceMetadata == null -> Log.d(
                    "[AnalyticsModule]", "Could not convert source metadata, thus they are not applied to the collector ($nativeId)"
                )
                else -> collector.addSourceMetadata(source,  sourceMetadata)
            }
        }
    }

    /**
     * Sets the source metadata for the current active source of the player associated to `playerId`.
     */
    @ReactMethod
    fun setSourceMetadata(nativeId: NativeId, playerId: NativeId?, json: ReadableMap?) {
        uiManager()?.addUIBlock { _ ->
            val source = playerModule()?.getPlayer(playerId)?.source
            val collector = collectors[nativeId]
            val sourceMetadata = JsonConverter.toAnalyticsSourceMetadata(json)
            when {
                source == null -> Log.d(
                    "[AnalyticsModule]", "Could not find source for player ($playerId)"
                )
                collector == null -> Log.d(
                    "[AnalyticsModule]", "Could not find analytics collector ($nativeId)"
                )
                sourceMetadata == null -> Log.d(
                    "[AnalyticsModule]", "Could not convert source metadata, thus they are not applied to the collector ($nativeId)"
                )
                else -> collector.setSourceMetadata(source,  sourceMetadata)
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
