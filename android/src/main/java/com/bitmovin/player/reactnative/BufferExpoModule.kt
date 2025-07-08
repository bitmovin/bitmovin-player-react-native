package com.bitmovin.player.reactnative

import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import com.bitmovin.player.api.buffer.BufferType

class BufferExpoModule : Module() {
    override fun definition() = ModuleDefinition {
        Name("BufferExpoModule")

        OnCreate {
            // Module initialization
        }

        // PHASE 1: Start with simple utility methods

        /**
         * Get buffer level for the specified player and buffer type.
         */
        AsyncFunction("getLevel") { playerId: String, type: String ->
            // Access PlayerExpoModule to retrieve player
            val player = PlayerExpoModule.getPlayerOrNull(playerId)
                ?: return@AsyncFunction null
            
            when (type.lowercase()) {
                "audio" -> player.buffer.getLevel(BufferType.AUDIO)
                "video" -> player.buffer.getLevel(BufferType.VIDEO)
                else -> null // Unknown buffer type
            }
        }

        /**
         * Set target level for the specified player and buffer type.
         */
        AsyncFunction("setTargetLevel") { playerId: String, type: String, value: Double ->
            // Access PlayerExpoModule to retrieve player
            val player = PlayerExpoModule.getPlayerOrNull(playerId)
                ?: return@AsyncFunction
            
            when (type.lowercase()) {
                "audio" -> player.buffer.setTargetLevel(BufferType.AUDIO, value)
                "video" -> player.buffer.setTargetLevel(BufferType.VIDEO, value)
                else -> {} // Unknown buffer type
            }
        }
    }
}