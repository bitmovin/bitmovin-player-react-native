package com.bitmovin.player.reactnative

import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import com.bitmovin.player.api.Player

class PlayerExpoModule : Module() {
    /**
     * In-memory mapping from [NativeId]s to [Player] instances.
     * This must match the Registry pattern from legacy PlayerModule
     */
    private val players: Registry<Player> = mutableMapOf()

    override fun definition() = ModuleDefinition {
        Name("PlayerExpoModule")

        OnCreate {
            // Module initialization
        }

        OnDestroy {
            // Clean up all players when module is destroyed
            players.values.forEach { player ->
                try {
                    player.destroy()
                } catch (e: Exception) {
                    // Log but don't crash on cleanup
                }
            }
            players.clear()
        }

        // PHASE 1: Start with simple utility methods to establish pattern

        /**
         * Returns the count of active players for debugging purposes
         */
        Function("getPlayerCount") {
            return players.size
        }

        /**
         * Checks if a player with the given nativeId exists
         */
        Function("hasPlayer") { nativeId: String ->
            return players.containsKey(nativeId)
        }

        // PHASE 2: Simple player control methods migration
        
        /**
         * Call .play() on nativeId's player.
         */
        AsyncFunction("play") { nativeId: String ->
            val player = players[nativeId]
            player?.play()
        }
        
        /**
         * Call .pause() on nativeId's player.
         */
        AsyncFunction("pause") { nativeId: String ->
            val player = players[nativeId]
            player?.pause()
        }
        
        /**
         * Call .mute() on nativeId's player.
         */
        AsyncFunction("mute") { nativeId: String ->
            val player = players[nativeId]
            player?.mute()
        }
        
        /**
         * Call .unmute() on nativeId's player.
         */
        AsyncFunction("unmute") { nativeId: String ->
            val player = players[nativeId]
            player?.unmute()
        }
        
        // TODO: Continue incrementally migrating remaining methods
        // Next batch: seek, timeShift, destroy, then complex methods
    }

    // CRITICAL: This method must remain available for cross-module access
    // Called by various modules including BufferModule, SourceModule, etc.
    fun getPlayerOrNull(nativeId: NativeId): Player? = players[nativeId]
}