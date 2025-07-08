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
        
        /**
         * Call .seek(time) on nativeId's player.
         */
        AsyncFunction("seek") { nativeId: String, time: Double ->
            val player = players[nativeId]
            player?.seek(time)
        }
        
        /**
         * Sets timeShift on nativeId's player.
         */
        AsyncFunction("timeShift") { nativeId: String, offset: Double ->
            val player = players[nativeId]
            player?.timeShift(offset)
        }
        
        /**
         * Call .destroy() on nativeId's player and remove from registry.
         * Also handles MediaSession cleanup.
         */
        AsyncFunction("destroy") { nativeId: String ->
            val player = players[nativeId]
            if (player != null) {
                // Note: MediaSession cleanup would need to be handled here
                // For now, just destroy the player and remove from registry
                player.destroy()
                players.remove(nativeId)
            }
        }
        
        /**
         * Call .setVolume(volume) on nativeId's player.
         */
        AsyncFunction("setVolume") { nativeId: String, volume: Int ->
            val player = players[nativeId]
            player?.volume = volume
        }
        
        /**
         * Resolve nativeId's current volume.
         */
        AsyncFunction("getVolume") { nativeId: String ->
            val player = players[nativeId]
            return@AsyncFunction player?.volume
        }
        
        /**
         * Resolve nativeId's current time.
         */
        AsyncFunction("currentTime") { nativeId: String, mode: String? ->
            val player = players[nativeId]
            return@AsyncFunction when {
                player == null -> null
                mode == "relative" -> player.currentTime + player.playbackTimeOffsetToRelativeTime
                mode == "absolute" -> player.currentTime + player.playbackTimeOffsetToAbsoluteTime
                else -> player.currentTime
            }
        }
        
        /**
         * Resolve nativeId's current playing state.
         */
        AsyncFunction("isPlaying") { nativeId: String ->
            val player = players[nativeId]
            return@AsyncFunction player?.isPlaying
        }
        
        /**
         * Resolve nativeId's current paused state.
         */
        AsyncFunction("isPaused") { nativeId: String ->
            val player = players[nativeId]
            return@AsyncFunction player?.isPaused
        }
        
        /**
         * Resolve nativeId's current source duration.
         */
        AsyncFunction("duration") { nativeId: String ->
            val player = players[nativeId]
            return@AsyncFunction player?.duration
        }
        
        /**
         * Resolve nativeId's current muted state.
         */
        AsyncFunction("isMuted") { nativeId: String ->
            val player = players[nativeId]
            return@AsyncFunction player?.isMuted
        }
        
        /**
         * Call .unload() on nativeId's player.
         */
        AsyncFunction("unload") { nativeId: String ->
            val player = players[nativeId]
            player?.unload()
        }
        
        /**
         * Resolve nativeId's current time shift value.
         */
        AsyncFunction("getTimeShift") { nativeId: String ->
            val player = players[nativeId]
            return@AsyncFunction player?.timeShift
        }
        
        /**
         * Resolve nativeId's live stream state.
         */
        AsyncFunction("isLive") { nativeId: String ->
            val player = players[nativeId]
            return@AsyncFunction player?.isLive
        }
        
        /**
         * Resolve nativeId's maximum time shift value.
         */
        AsyncFunction("getMaxTimeShift") { nativeId: String ->
            val player = players[nativeId]
            return@AsyncFunction player?.maxTimeShift
        }
        
        /**
         * Resolve nativeId's current playback speed.
         */
        AsyncFunction("getPlaybackSpeed") { nativeId: String ->
            val player = players[nativeId]
            return@AsyncFunction player?.playbackSpeed
        }
        
        /**
         * Set playback speed for nativeId's player.
         */
        AsyncFunction("setPlaybackSpeed") { nativeId: String, playbackSpeed: Float ->
            val player = players[nativeId]
            player?.playbackSpeed = playbackSpeed
        }
        
        // TODO: Continue with more methods (loadSource requires SourceModule dependency)
    }

    // CRITICAL: This method must remain available for cross-module access
    // Called by various modules including BufferModule, SourceModule, etc.
    fun getPlayerOrNull(nativeId: NativeId): Player? = players[nativeId]
}