import BitmovinPlayer
import ExpoModulesCore

/**
 * Global registry for Player instances that allows static access from anywhere in native code
 * without requiring access to the PlayerModule instance or Expo runtime.
 */
public class PlayerRegistry {
    private static let shared = PlayerRegistry()
    private var players: Registry<Player> = [:]
    private let queue = DispatchQueue(label: "PlayerRegistry", attributes: .concurrent)

    private init() {}

    /**
     * Register a player instance with the given native ID.
     */
    public static func register(player: Player, nativeId: NativeId) {
        shared.queue.async(flags: .barrier) {
            shared.players[nativeId] = player
        }
    }

    /**
     * Unregister a player instance with the given native ID.
     */
    public static func unregister(nativeId: NativeId) {
        shared.queue.async(flags: .barrier) {
            shared.players[nativeId] = nil
        }
    }

    /**
     * Get a player instance by native ID.
     * Returns nil if no player is registered with the given ID.
     */
    public static func getPlayer(nativeId: NativeId) -> Player? {
        shared.queue.sync {
            shared.players[nativeId]
        }
    }

    /**
     * Get all registered player instances.
     */
    public static func getAllPlayers() -> [Player] {
        shared.queue.sync {
            Array(shared.players.values)
        }
    }

    /**
     * Get all registered native IDs.
     */
    public static func getAllNativeIds() -> [NativeId] {
        shared.queue.sync {
            Array(shared.players.keys)
        }
    }

    /**
     * Check if a player is registered with the given native ID.
     */
    public static func hasPlayer(nativeId: NativeId) -> Bool {
        shared.queue.sync {
            shared.players[nativeId] != nil
        }
    }

    /**
     * Clear all registered players.
     * Note: This does not destroy the players, just removes them from the registry.
     */
    public static func clear() {
        shared.queue.async(flags: .barrier) {
            shared.players.removeAll()
        }
    }

    /**
     * Get the count of registered players.
     */
    public static func count() -> Int {
        shared.queue.sync {
            shared.players.count
        }
    }
}
