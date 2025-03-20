package com.bitmovin.player.reactnative

import com.bitmovin.player.api.decoder.DecoderConfig
import com.bitmovin.player.api.decoder.DecoderPriorityProvider
import com.bitmovin.player.api.decoder.MediaCodecInfo
import com.bitmovin.player.reactnative.converter.toJson
import com.bitmovin.player.reactnative.converter.toMediaCodecInfo
import com.facebook.react.bridge.*
import com.facebook.react.module.annotations.ReactModule
import java.util.concurrent.locks.ReentrantLock
import kotlin.concurrent.withLock

private const val MODULE_NAME = "DecoderConfigModule"

@ReactModule(name = MODULE_NAME)
class DecoderConfigModule(context: ReactApplicationContext) : BitmovinBaseModule(context) {

    /**
     * In-memory mapping from `nativeId`s to `DecoderConfig` instances.
     */
    private val decoderConfigs: Registry<DecoderConfig> = mutableMapOf()
    private val decoderPriorityProviderResponses: Registry<List<MediaCodecInfo>> = mutableMapOf()

    /**
     * Module's local lock object used to sync calls between Kotlin and JS.
     */
    private val lock = ReentrantLock()

    /**
     *  Lock condition used to sync operations on the fullscreen handler.
     */
    private val decoderOrderedCondition = lock.newCondition()

    override fun getName() = MODULE_NAME

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
        decoderPriorityProviderResponses.keys.filter {
            it.startsWith(nativeId)
        }.forEach {
            decoderPriorityProviderResponses.remove(it)
        }
    }

    fun overrideDecoderPriorityProvider(
        nativeId: NativeId,
        context: DecoderPriorityProvider.DecoderContext,
        preferredDecoders: List<MediaCodecInfo>,
    ): List<MediaCodecInfo> {
        val args = Arguments.createArray()
        args.pushMap(context.toJson())
        args.pushArray(preferredDecoders.toJson())

        this.context.catalystInstance.callFunction(
            "DecoderConfigBridge-$nativeId",
            "overrideDecodersPriority",
            args as NativeArray,
        )

        var response: List<MediaCodecInfo>? = null
        lock.withLock {
            while (response == null) {
                decoderOrderedCondition.await()
                response = decoderPriorityProviderResponses[nativeId]
            }
        }

        return response!!
    }

    @ReactMethod
    fun overrideDecoderPriorityProviderComplete(nativeId: NativeId, response: ReadableArray) {
        decoderPriorityProviderResponses[nativeId] = response.toMediaCodecInfo()
        lock.withLock {
            decoderOrderedCondition.signal()
        }
    }
}
