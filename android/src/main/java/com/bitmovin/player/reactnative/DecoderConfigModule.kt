package com.bitmovin.player.reactnative

import com.bitmovin.player.api.decoder.DecoderConfig
import com.bitmovin.player.api.decoder.DecoderPriorityProvider
import com.bitmovin.player.api.decoder.MediaCodecInfo
import com.bitmovin.player.reactnative.converter.toJson
import com.bitmovin.player.reactnative.extensions.getModule
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
    private val decoderConfigs: Registry<DecoderConfigBridge> = mutableMapOf()

    /**
     * Module's local lock object used to sync calls between Kotlin and JS.
     */
    private val lock = ReentrantLock()

    /**
     *  Lock condition used to sync operations on the fullscreen handler.
     */
    private val decoderOrderedCondition = lock.newCondition()

    override fun getName() = MODULE_NAME

    @ReactMethod
    fun initWithConfig(nativeId: NativeId, config: ReadableMap, promise: Promise) {
        promise.unit.resolveOnUiThread {
            if (decoderConfigs.containsKey(nativeId)) {
                return@resolveOnUiThread
            }
            if (config.getMap("playbackConfig")?.hasKey("decoderConfig") == false) {
                return@resolveOnUiThread
            }

            val decoderConfig = DecoderConfig(
                decoderPriorityProvider = { context, preferredDecoders ->
                    overrideDecoderPriorityProvider(nativeId, context, preferredDecoders)
                },
            )
            val decoderBridge = DecoderConfigBridge(context, nativeId, decoderConfig)
            decoderConfigs[nativeId] = decoderBridge
        }
    }

    @ReactMethod
    fun destroy(nativeId: NativeId) {
        decoderConfigs.remove(nativeId)
    }

    fun overrideDecoderPriorityProvider(
        nativeId: NativeId,
        context: DecoderPriorityProvider.DecoderContext,
        preferredDecoders: List<MediaCodecInfo>,
    ): List<MediaCodecInfo> {

        val bridge = decoderConfigs[nativeId] ?: return preferredDecoders

        val requestId = "$nativeId@${System.identityHashCode(context)}@${System.identityHashCode(preferredDecoders)}"
        val args = Arguments.createArray()
        args.pushString(requestId)
        args.pushMap(context.toJson())
        args.pushArray(preferredDecoders.toJson())

        this.context.catalystInstance.callFunction(
            "DecoderConfigBridge-$nativeId",
            "overrideDecodersPriority",
            args as NativeArray,
        )

        lock.withLock {
            decoderOrderedCondition.await()
        }

        return bridge.preferredDecodersPriority
    }

    @ReactMethod
    fun overrideDecoderPriorityProviderComplete(nativeId: NativeId, preferredDecodersPriority: List<MediaCodecInfo>) {
        decoderConfigs[nativeId]?.preferredDecodersPriority = preferredDecodersPriority
        lock.withLock {
            decoderOrderedCondition.signal()
        }
    }
}

private class DecoderConfigBridge(
    private val context: ReactApplicationContext,
    private val nativeId: NativeId,
    var config: DecoderConfig,
) : DecoderPriorityProvider {

    var preferredDecodersPriority: List<MediaCodecInfo> = emptyList()

    override fun overrideDecodersPriority(
        context: DecoderPriorityProvider.DecoderContext,
        preferredDecoders: List<MediaCodecInfo>,
    ): List<MediaCodecInfo> {
        return this.context.getModule<DecoderConfigModule>()
            ?.overrideDecoderPriorityProvider(
                nativeId,
                context,
                preferredDecoders,
            )
            ?: preferredDecoders
    }
}
