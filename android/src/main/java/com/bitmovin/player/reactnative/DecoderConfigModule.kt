package com.bitmovin.player.reactnative

import androidx.concurrent.futures.CallbackToFutureAdapter
import com.bitmovin.player.api.decoder.DecoderConfig
import com.bitmovin.player.api.decoder.DecoderPriorityProvider
import com.bitmovin.player.api.decoder.MediaCodecInfo
import com.bitmovin.player.reactnative.converter.toJson
import com.bitmovin.player.reactnative.converter.toMediaCodecInfoList
import com.facebook.react.bridge.*
import com.facebook.react.module.annotations.ReactModule
import java.util.concurrent.ConcurrentHashMap

private const val MODULE_NAME = "DecoderConfigModule"

@ReactModule(name = MODULE_NAME)
class DecoderConfigModule(context: ReactApplicationContext) : BitmovinBaseModule(context) {
    override fun getName() = MODULE_NAME

    /**
     * In-memory mapping from `nativeId`s to `DecoderConfig` instances.
     */
    private val decoderConfigs: Registry<DecoderConfig> = mutableMapOf()
    private val completers = ConcurrentHashMap<NativeId, CallbackToFutureAdapter.Completer<List<MediaCodecInfo>>>()

    fun getConfig(nativeId: NativeId?): DecoderConfig? = nativeId?.let { decoderConfigs[it] }

    @ReactMethod
    fun initWithConfig(nativeId: NativeId, config: ReadableMap, promise: Promise) {
        if (decoderConfigs.containsKey(nativeId)) {
            return
        }
        if (config.getMap("playbackConfig")?.hasKey("decoderConfig") == false) {
            return
        }

        val decoderConfig = DecoderConfig(
            decoderPriorityProvider = object : DecoderPriorityProvider {
                override fun overrideDecodersPriority(
                    context: DecoderPriorityProvider.DecoderContext,
                    preferredDecoders: List<MediaCodecInfo>,
                ): List<MediaCodecInfo> {
                    return overrideDecoderPriorityProvider(nativeId, context, preferredDecoders)
                }
            },
        )
        decoderConfigs[nativeId] = decoderConfig
    }

    @ReactMethod
    fun destroy(nativeId: NativeId) {
        decoderConfigs.remove(nativeId)
        completers.keys.filter { it.startsWith(nativeId) }.forEach {
            completers.remove(it)
        }
    }

    private fun overrideDecoderPriorityProvider(
        nativeId: NativeId,
        context: DecoderPriorityProvider.DecoderContext,
        preferredDecoders: List<MediaCodecInfo>,
    ): List<MediaCodecInfo> {
        return CallbackToFutureAdapter.getFuture { completer ->
            completers[nativeId] = completer
            val args = Arguments.createArray()
            args.pushMap(context.toJson())
            args.pushArray(preferredDecoders.toJson())
            this@DecoderConfigModule.context.catalystInstance.callFunction(
                "DecoderConfigBridge-$nativeId",
                "overrideDecodersPriority",
                args as NativeArray,
            )
        }.get()
    }

    @ReactMethod
    fun overrideDecoderPriorityProviderComplete(nativeId: NativeId, response: ReadableArray) {
        completers[nativeId]?.set(response.toMediaCodecInfoList())
        completers.remove(nativeId)
    }
}
