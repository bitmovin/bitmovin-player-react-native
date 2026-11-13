package com.bitmovin.player.reactnative

import com.bitmovin.player.api.media.MediaType
import com.bitmovin.player.reactnative.converter.toBufferTypeOrThrow
import com.bitmovin.player.reactnative.converter.toJson
import expo.modules.kotlin.functions.Queues
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class BufferModule : Module() {
    override fun definition() = ModuleDefinition {
        Name("BufferModule")

        OnCreate {
            // Module initialization
        }

        AsyncFunction("getLevel") { owner: SharedPlayer, type: String ->
            val player = owner.player

            val bufferType = type.toBufferTypeOrThrow()
            val audioLevel = player.buffer.getLevel(bufferType, MediaType.Audio)
            val videoLevel = player.buffer.getLevel(bufferType, MediaType.Video)

            return@AsyncFunction mapOf(
                "audio" to audioLevel.toJson(),
                "video" to videoLevel.toJson(),
            )
        }.runOnQueue(Queues.MAIN)

        AsyncFunction("setTargetLevel") { owner: SharedPlayer, type: String, value: Double ->
            // Access PlayerModule to retrieve player
            val player = owner.player

            player.buffer.setTargetLevel(type.toBufferTypeOrThrow(), value)
        }.runOnQueue(Queues.MAIN)
    }
}
