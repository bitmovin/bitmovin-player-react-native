package com.bitmovin.player.reactnative

import androidx.concurrent.futures.CallbackToFutureAdapter
import androidx.core.os.bundleOf
import com.bitmovin.player.api.decoder.DecoderConfig
import com.bitmovin.player.api.decoder.DecoderPriorityProvider
import com.bitmovin.player.api.decoder.MediaCodecInfo
import com.bitmovin.player.reactnative.converter.toJson
import com.bitmovin.player.reactnative.converter.toMediaCodecInfoList
import expo.modules.kotlin.exception.CodedException
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import java.util.concurrent.ConcurrentHashMap

class DecoderConfigModule : Module() {

    /**
     * In-memory mapping from `nativeId`s to `DecoderConfig` instances.
     * This must match the Registry pattern from legacy DecoderConfigModule
     */
    private val decoderConfigs: Registry<DecoderConfig> = mutableMapOf()
    private val overrideDecoderPriorityProviderCompleters =
        ConcurrentHashMap<String, CallbackToFutureAdapter.Completer<List<MediaCodecInfo>>>()

    override fun definition() = ModuleDefinition {
        Name("DecoderConfigModule")

        Events("onOverrideDecodersPriority")

        OnCreate {
            // Module initialization
        }

        OnDestroy {
            // Clean up decoder configs
            decoderConfigs.clear()
            overrideDecoderPriorityProviderCompleters.clear()
        }

        /**
         * Creates a new `DecoderConfig` instance inside the internal decoder configs using the provided `config` object.
         */
        AsyncFunction("initializeWithConfig") { nativeId: String, config: Map<String, Any?> ->
            if (decoderConfigs.containsKey(nativeId)) {
                return@AsyncFunction
            }

            val playbackConfig = config["playbackConfig"] as? Map<String, Any?>
            if (playbackConfig?.containsKey("decoderConfig") != true) {
                return@AsyncFunction
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

        /**
         * Completes the decoder priority provider override process
         */
        AsyncFunction("overrideDecoderPriorityProviderComplete") { nativeId: String,
            response: List<Map<String, Any?>>, ->
            val completer = overrideDecoderPriorityProviderCompleters[nativeId]
                ?: throw DecoderConfigException.NoCompleterFound(nativeId)

            val mediaCodecInfoList = response.toMediaCodecInfoList()
            completer.set(mediaCodecInfoList)
            overrideDecoderPriorityProviderCompleters.remove(nativeId)
        }

        /**
         * Destroys the `DecoderConfig` instance referenced by `nativeId`
         */
        AsyncFunction("destroy") { nativeId: String ->
            decoderConfigs.remove(nativeId)
            // Remove all completers that start with this nativeId
            overrideDecoderPriorityProviderCompleters.keys.filter { it.startsWith(nativeId) }.forEach {
                overrideDecoderPriorityProviderCompleters.remove(it)
            }
        }
    }

    /**
     * Helper function to handle decoder priority provider override
     */
    private fun overrideDecoderPriorityProvider(
        nativeId: String,
        context: DecoderPriorityProvider.DecoderContext,
        preferredDecoders: List<MediaCodecInfo>,
    ): List<MediaCodecInfo> {
        return CallbackToFutureAdapter.getFuture { completer ->
            overrideDecoderPriorityProviderCompleters[nativeId] = completer
            // Send event to TypeScript with decoder context and preferred decoders
            sendEvent(
                "onOverrideDecodersPriority",
                bundleOf(
                    "nativeId" to nativeId,
                    "context" to context.toJson(),
                    "preferredDecoders" to preferredDecoders.map { it.toJson() },
                ),
            )

            "overrideDecoderPriorityProvider"
        }.get()
    }

    val decoderConfig: DecoderConfig?
        get() = decoderConfigs.values.firstOrNull()

    fun getDecoderConfig(nativeId: String): DecoderConfig? = decoderConfigs[nativeId]
}

// MARK: - Exception Definitions

sealed class DecoderConfigException(message: String) : CodedException(message) {
    class NoCompleterFound(nativeId: String) : DecoderConfigException(
        "No completer found for decoder config: $nativeId",
    )
}
