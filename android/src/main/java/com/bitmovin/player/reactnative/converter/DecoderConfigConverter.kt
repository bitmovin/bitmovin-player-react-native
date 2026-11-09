package com.bitmovin.player.reactnative.converter

import com.bitmovin.player.api.decoder.DecoderConfig
import com.bitmovin.player.api.decoder.DecoderPriorityProvider
import com.bitmovin.player.api.decoder.MediaCodecInfo
import com.bitmovin.player.reactnative.CallbackScope

fun toDecoderConfig(callbacks: CallbackScope): DecoderConfig = DecoderConfig(
    decoderPriorityProvider = object : DecoderPriorityProvider {
        override fun overrideDecodersPriority(
            context: DecoderPriorityProvider.DecoderContext,
            preferredDecoders: List<MediaCodecInfo>,
        ): List<MediaCodecInfo> {
            @Suppress("UNCHECKED_CAST")
            val result = callbacks.call(
                "playbackConfig.decoderConfig.decoderPriorityProvider.overrideDecodersPriority",
                listOf(context.toJson(), preferredDecoders.map { it.toJson() }),
                5000,
            ) as? List<Map<String, Any?>>
            return result?.toMediaCodecInfoList() ?: preferredDecoders
        }
    },
)
