package com.bitmovin.player.reactnative.converter

import com.bitmovin.player.api.decoder.DecoderConfig
import com.bitmovin.player.api.decoder.DecoderPriorityProvider
import com.bitmovin.player.api.decoder.MediaCodecInfo
import com.bitmovin.player.reactnative.CallbackScope
import com.bitmovin.player.reactnative.extensions.getMap
import com.bitmovin.player.reactnative.extensions.getString

fun Map<String, Any?>?.toDecoderConfig(callbacks: CallbackScope): DecoderConfig? {
    if (this == null) return null
    val token = getMap("decoderPriorityProvider")?.getString("overrideDecodersPriority")
    return DecoderConfig(
        decoderPriorityProvider = object : DecoderPriorityProvider {
            override fun overrideDecodersPriority(
                context: DecoderPriorityProvider.DecoderContext,
                preferredDecoders: List<MediaCodecInfo>,
            ): List<MediaCodecInfo> {
                @Suppress("UNCHECKED_CAST")
                val result = token?.let {
                    callbacks.call(it, listOf(context.toJson(), preferredDecoders.map { it.toJson() }))
                } as? List<Map<String, Any?>>
                return result?.toMediaCodecInfoList() ?: preferredDecoders
            }
        },
    )
}
