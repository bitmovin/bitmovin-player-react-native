package com.bitmovin.player.reactnative

import com.bitmovin.player.api.decoder.DecoderConfig
import com.bitmovin.player.api.decoder.DecoderPriorityProvider
import com.bitmovin.player.api.decoder.MediaCodecInfo
import com.bitmovin.player.reactnative.converter.toJson
import com.bitmovin.player.reactnative.converter.toMediaCodecInfoList
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.jni.JavaScriptFunction
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import expo.modules.kotlin.sharedobjects.SharedObject

class SharedDecoder(appContext: AppContext, config: Map<String, Any?>, callback: JavaScriptFunction<Any?>?) :
    SharedObject(appContext) {
    private val callbacks = CallbackScope(appContext, callback)
    val config = DecoderConfig(
        decoderPriorityProvider = object : DecoderPriorityProvider {
            override fun overrideDecodersPriority(
                context: DecoderPriorityProvider.DecoderContext,
                preferredDecoders: List<MediaCodecInfo>,
            ): List<MediaCodecInfo> {
                @Suppress("UNCHECKED_CAST")
                val result = callbacks.call(
                    "overrideDecodersPriority",
                    listOf(context.toJson(), preferredDecoders.map { it.toJson() }),
                    5000,
                ) as? List<Map<String, Any?>>
                return result?.toMediaCodecInfoList() ?: preferredDecoders
            }
        },
    )
    fun destroy() = callbacks.close()
    override fun sharedObjectDidRelease() = destroy()
}

class DecoderConfigModule : Module() {
    override fun definition() = ModuleDefinition {
        Name("DecoderConfigModule")
        Function("create") { config: Map<String, Any?>, callback: JavaScriptFunction<Any?>? ->
            SharedDecoder(appContext, config, callback)
        }
        Class(SharedDecoder::class) {
            Constructor { config: Map<String, Any?>, callback: JavaScriptFunction<Any?>? ->
                SharedDecoder(appContext, config, callback)
            }
            AsyncFunction("destroy") { owner: SharedDecoder -> owner.destroy() }
        }
    }
}
