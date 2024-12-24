package com.bitmovin.player.reactnative

import android.util.Log
import androidx.concurrent.futures.CallbackToFutureAdapter
import androidx.concurrent.futures.CallbackToFutureAdapter.Completer
import com.bitmovin.player.api.media.AdaptationConfig
import com.bitmovin.player.api.media.video.quality.VideoAdaptation
import com.bitmovin.player.api.media.video.quality.VideoAdaptationData
import com.bitmovin.player.reactnative.converter.toAdaptationConfig
import com.bitmovin.player.reactnative.converter.toJson
import com.facebook.react.bridge.*
import com.facebook.react.module.annotations.ReactModule
import java.lang.Exception
import java.util.concurrent.ConcurrentHashMap
import java.util.concurrent.Future
import java.util.concurrent.TimeUnit

private const val MODULE_NAME = "AdaptationModule"

@ReactModule(name = MODULE_NAME)
class AdaptationModule(context: ReactApplicationContext) : BitmovinBaseModule(context) {
    /**
     * In-memory mapping from `nativeId`s to `AdaptationConfig` instances.
     */
    private val adaptationConfigs: Registry<AdaptationConfig> = mutableMapOf()
    private val onVideoAdaptationCompleters = ConcurrentHashMap<String, Completer<String>>()

    override fun getName() = MODULE_NAME

    fun getConfig(nativeId: NativeId?): AdaptationConfig? = nativeId?.let { adaptationConfigs[it] }

    @ReactMethod
    fun initWithConfig(nativeId: NativeId, config: ReadableMap, promise: Promise) {
        promise.unit.resolveOnUiThread {
            if (adaptationConfigs.containsKey(nativeId)) {
                return@resolveOnUiThread
            }
            val adaptationConfig = config.toAdaptationConfig()
            adaptationConfigs[nativeId] = adaptationConfig
            initConfigBlocks(nativeId, config)
        }
    }

    @ReactMethod
    fun destroy(nativeId: NativeId) {
        adaptationConfigs.remove(nativeId)
        onVideoAdaptationCompleters.keys.filter { it.startsWith(nativeId) }.forEach {
            onVideoAdaptationCompleters.remove(it)
        }
    }

    private fun initConfigBlocks(nativeId: String, config: ReadableMap) {
        initVideoAdaptationData(nativeId, adaptationConfigJson = config)
    }

    private fun initVideoAdaptationData(nativeId: NativeId, adaptationConfigJson: ReadableMap) {
        val adaptationConfig = getConfig(nativeId) ?: return
        if (!adaptationConfigJson.hasKey("videoAdaptation")) return

        adaptationConfig.videoAdaptation = VideoAdaptation { data ->
            val future = onVideoAdaptationFromJS(nativeId, data)
            try {
                val callbackValue = future.get(1, TimeUnit.SECONDS) // set timeout to mimize playback performance impact
                callbackValue
            } catch (e: Exception) {
                Log.e(MODULE_NAME, "custom RN onVideoAdaptation exception $e. Using default of ${data.suggested}")
                data.suggested
            }
        }
    }

    private fun onVideoAdaptationFromJS(
        nativeId: NativeId,
        data: VideoAdaptationData,
    ): Future<String> {
        val onVideoAdaptationId = "$nativeId@${System.identityHashCode(data)}"
        val args = Arguments.createArray()
        args.pushString(onVideoAdaptationId)
        args.pushMap(data.toJson())

        return CallbackToFutureAdapter.getFuture { completer ->
            onVideoAdaptationCompleters[onVideoAdaptationId] = completer
            context.catalystInstance.callFunction("Adaptation-$nativeId", "onVideoAdaptation", args as NativeArray)
        }
    }

    @ReactMethod
    fun setOnVideoAdaptation(onVideoAdaptationId: String, data: String) {
        val completer = onVideoAdaptationCompleters.remove(onVideoAdaptationId)
        if (completer == null) {
            Log.e(
                MODULE_NAME,
                "Completer is null for onVideoAdaptationId: $onVideoAdaptationId, this can cause adaptation errors",
            )
            return
        }
        completer.set(data)
    }
}
