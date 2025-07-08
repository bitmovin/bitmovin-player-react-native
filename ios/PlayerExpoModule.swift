import ExpoModulesCore
import BitmovinPlayer

public class PlayerExpoModule: Module {
    /// In-memory mapping from `nativeId`s to `Player` instances.
    /// This must match the Registry pattern from legacy PlayerModule
    private var players: Registry<Player> = [:]
    
    public func definition() -> ModuleDefinition {
        Name("PlayerExpoModule")
        
        OnCreate {
            // Module initialization
        }
        
        OnDestroy {
            // Destroy all players on the main thread when the module is deallocated.
            // This is necessary when the IMA SDK is present in the app, as it may crash if the players are destroyed on a
            // background thread.
            DispatchQueue.main.async { [players] in
                players.values.forEach { $0.destroy() }
            }
        }
        
        // PHASE 1: Start with simple utility methods to establish pattern
        
        /**
         Returns the count of active players for debugging purposes
         */
        Function("getPlayerCount") {
            return players.count
        }
        
        /**
         Checks if a player with the given nativeId exists
         */
        Function("hasPlayer") { (nativeId: String) in
            return players[nativeId] != nil
        }
        
        // PHASE 2: Simple player control methods migration
        
        /**
         Call .play() on nativeId's player.
         */
        AsyncFunction("play") { (nativeId: String) in
            await withCheckedContinuation { continuation in
                DispatchQueue.main.async { [weak self] in
                    self?.players[nativeId]?.play()
                    continuation.resume()
                }
            }
        }
        
        /**
         Call .pause() on nativeId's player.
         */
        AsyncFunction("pause") { (nativeId: String) in
            await withCheckedContinuation { continuation in
                DispatchQueue.main.async { [weak self] in
                    self?.players[nativeId]?.pause()
                    continuation.resume()
                }
            }
        }
        
        /**
         Call .mute() on nativeId's player.
         */
        AsyncFunction("mute") { (nativeId: String) in
            await withCheckedContinuation { continuation in
                DispatchQueue.main.async { [weak self] in
                    self?.players[nativeId]?.mute()
                    continuation.resume()
                }
            }
        }
        
        /**
         Call .unmute() on nativeId's player.
         */
        AsyncFunction("unmute") { (nativeId: String) in
            await withCheckedContinuation { continuation in
                DispatchQueue.main.async { [weak self] in
                    self?.players[nativeId]?.unmute()
                    continuation.resume()
                }
            }
        }
        
        // TODO: Continue incrementally migrating remaining methods
        // Next batch: seek, timeShift, destroy, then complex methods
    }
    
    // CRITICAL: This method must remain available for cross-module access
    // Called by BufferModule, PlayerAnalyticsModule, RNPlayerViewManager, etc.
    @objc
    public func retrieve(_ nativeId: NativeId) -> Player? {
        players[nativeId]
    }
}