package com.bitmovin.player.reactnative

import com.bitmovin.player.api.Player
import java.util.concurrent.ConcurrentHashMap

/**
 * Global registry for Player instances that allows static access from anywhere in native code
 * without requiring access to the PlayerModule instance or Expo runtime.
 */
object PlayerRegistry {
    private val players: Registry<Player> = ConcurrentHashMap()
    
    /**
     * Register a player instance with the given native ID.
     */
    @JvmStatic
    fun register(player: Player, nativeId: NativeId) {
        players[nativeId] = player
    }
    
    /**
     * Unregister a player instance with the given native ID.
     */
    @JvmStatic
    fun unregister(nativeId: NativeId) {
        players.remove(nativeId)
    }
    
    /**
     * Get a player instance by native ID.
     * Returns null if no player is registered with the given ID.
     */
    @JvmStatic
    fun getPlayer(nativeId: NativeId): Player? {
        return players[nativeId]
    }
    
    /**
     * Get all registered player instances.
     */
    @JvmStatic
    fun getAllPlayers(): List<Player> {
        return players.values.toList()
    }
    
    /**
     * Get all registered native IDs.
     */
    @JvmStatic
    fun getAllNativeIds(): List<NativeId> {
        return players.keys.toList()
    }
    
    /**
     * Check if a player is registered with the given native ID.
     */
    @JvmStatic
    fun hasPlayer(nativeId: NativeId): Boolean {
        return players.containsKey(nativeId)
    }
    
    /**
     * Clear all registered players.
     * Note: This does not destroy the players, just removes them from the registry.
     */
    @JvmStatic
    fun clear() {
        players.clear()
    }
    
    /**
     * Get the count of registered players.
     */
    @JvmStatic
    fun count(): Int {
        return players.size
    }
}