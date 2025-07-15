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

        /**
         * Get buffer level for the specified player and buffer type.
         */
        AsyncFunction("getLevel") { playerId: String, type: String ->
            // Access PlayerModule to retrieve player
            val player = appContext.registry.getModule<PlayerModule>()?.getPlayerOrNull(playerId)
                ?: return@AsyncFunction null

            val bufferType = type.toBufferTypeOrThrow()
            val level = player.buffer.getLevel(bufferType, MediaType.Video)
            level.toJson()
        }

        /**
         * Set target level for the specified player and buffer type.
         */
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
