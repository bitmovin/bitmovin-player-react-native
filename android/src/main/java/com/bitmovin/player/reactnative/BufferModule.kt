package com.bitmovin.player.reactnative

import com.bitmovin.player.api.buffer.BufferType
import com.bitmovin.player.api.media.MediaType
import com.bitmovin.player.reactnative.converter.toBufferTypeOrThrow
import com.bitmovin.player.reactnative.converter.toJson
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class BufferModule : Module() {
    override fun definition() = ModuleDefinition {
        Name("BufferModule")

        OnCreate {
            // Module initialization
        }

        AsyncFunction("getLevel") { playerId: String, type: String ->
            val player = appContext.registry.getModule<PlayerModule>()?.getPlayerOrNull(playerId)
                ?: return@AsyncFunction null

            val bufferType = type.toBufferTypeOrThrow()
            val audioLevel = player.buffer.getLevel(bufferType, MediaType.Audio)
            val videoLevel = player.buffer.getLevel(bufferType, MediaType.Video)

            return@AsyncFunction mapOf(
                "audio" to audioLevel.toJson(),
                "video" to videoLevel.toJson()
            )
        }

        AsyncFunction("setTargetLevel") { playerId: String, type: String, value: Double ->
            // Access PlayerModule to retrieve player
            val player = appContext.registry.getModule<PlayerModule>()?.getPlayerOrNull(playerId)
                ?: return@AsyncFunction

            val bufferType = type.toBufferTypeOrThrow()
            if (bufferType == BufferType.ForwardDuration) {
                player.buffer.setTargetLevel(bufferType, value)
            }
        }
    }
}
