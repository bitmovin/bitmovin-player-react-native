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
        
        /**
         Call .seek(time:) on nativeId's player.
         */
        AsyncFunction("seek") { (nativeId: String, time: Double) in
            await withCheckedContinuation { continuation in
                DispatchQueue.main.async { [weak self] in
                    self?.players[nativeId]?.seek(time: time)
                    continuation.resume()
                }
            }
        }
        
        /**
         Sets timeShift on nativeId's player.
         */
        AsyncFunction("timeShift") { (nativeId: String, offset: Double) in
            await withCheckedContinuation { continuation in
                DispatchQueue.main.async { [weak self] in
                    self?.players[nativeId]?.timeShift = offset
                    continuation.resume()
                }
            }
        }
        
        /**
         Call .destroy() on nativeId's player and remove from registry.
         */
        AsyncFunction("destroy") { (nativeId: String) in
            await withCheckedContinuation { continuation in
                DispatchQueue.main.async { [weak self] in
                    if let player = self?.players[nativeId] {
                        player.destroy()
                        self?.players[nativeId] = nil
                    }
                    continuation.resume()
                }
            }
        }
        
        /**
         Call .setVolume(volume:) on nativeId's player.
         */
        AsyncFunction("setVolume") { (nativeId: String, volume: Int) in
            await withCheckedContinuation { continuation in
                DispatchQueue.main.async { [weak self] in
                    self?.players[nativeId]?.volume = volume
                    continuation.resume()
                }
            }
        }
        
        /**
         Resolve nativeId's current volume.
         */
        AsyncFunction("getVolume") { (nativeId: String) -> Int? in
            await withCheckedContinuation { continuation in
                DispatchQueue.main.async { [weak self] in
                    let volume = self?.players[nativeId]?.volume
                    continuation.resume(returning: volume)
                }
            }
        }
        
        /**
         Resolve nativeId's current time.
         */
        AsyncFunction("currentTime") { (nativeId: String, mode: String?) -> Double? in
            await withCheckedContinuation { continuation in
                DispatchQueue.main.async { [weak self] in
                    let player = self?.players[nativeId]
                    if let mode {
                        let currentTime = player?.currentTime(RCTConvert.timeMode(mode))
                        continuation.resume(returning: currentTime)
                    } else {
                        let currentTime = player?.currentTime
                        continuation.resume(returning: currentTime)
                    }
                }
            }
        }
        
        /**
         Resolve nativeId's current playing state.
         */
        AsyncFunction("isPlaying") { (nativeId: String) -> Bool? in
            await withCheckedContinuation { continuation in
                DispatchQueue.main.async { [weak self] in
                    let isPlaying = self?.players[nativeId]?.isPlaying
                    continuation.resume(returning: isPlaying)
                }
            }
        }
        
        /**
         Resolve nativeId's current paused state.
         */
        AsyncFunction("isPaused") { (nativeId: String) -> Bool? in
            await withCheckedContinuation { continuation in
                DispatchQueue.main.async { [weak self] in
                    let isPaused = self?.players[nativeId]?.isPaused
                    continuation.resume(returning: isPaused)
                }
            }
        }
        
        /**
         Resolve nativeId's active source duration.
         */
        AsyncFunction("duration") { (nativeId: String) -> Double? in
            await withCheckedContinuation { continuation in
                DispatchQueue.main.async { [weak self] in
                    let duration = self?.players[nativeId]?.duration
                    continuation.resume(returning: duration)
                }
            }
        }
        
        /**
         Resolve nativeId's current muted state.
         */
        AsyncFunction("isMuted") { (nativeId: String) -> Bool? in
            await withCheckedContinuation { continuation in
                DispatchQueue.main.async { [weak self] in
                    let isMuted = self?.players[nativeId]?.isMuted
                    continuation.resume(returning: isMuted)
                }
            }
        }
        
        /**
         Call .unload() on nativeId's player.
         */
        AsyncFunction("unload") { (nativeId: String) in
            await withCheckedContinuation { continuation in
                DispatchQueue.main.async { [weak self] in
                    self?.players[nativeId]?.unload()
                    continuation.resume()
                }
            }
        }
        
        /**
         Resolve nativeId's current time shift value.
         */
        AsyncFunction("getTimeShift") { (nativeId: String) -> Double? in
            await withCheckedContinuation { continuation in
                DispatchQueue.main.async { [weak self] in
                    let timeShift = self?.players[nativeId]?.timeShift
                    continuation.resume(returning: timeShift)
                }
            }
        }
        
        /**
         Resolve nativeId's live stream state.
         */
        AsyncFunction("isLive") { (nativeId: String) -> Bool? in
            await withCheckedContinuation { continuation in
                DispatchQueue.main.async { [weak self] in
                    let isLive = self?.players[nativeId]?.isLive
                    continuation.resume(returning: isLive)
                }
            }
        }
        
        /**
         Resolve nativeId's maximum time shift value.
         */
        AsyncFunction("getMaxTimeShift") { (nativeId: String) -> Double? in
            await withCheckedContinuation { continuation in
                DispatchQueue.main.async { [weak self] in
                    let maxTimeShift = self?.players[nativeId]?.maxTimeShift
                    continuation.resume(returning: maxTimeShift)
                }
            }
        }
        
        /**
         Resolve nativeId's current playback speed.
         */
        AsyncFunction("getPlaybackSpeed") { (nativeId: String) -> Float? in
            await withCheckedContinuation { continuation in
                DispatchQueue.main.async { [weak self] in
                    let playbackSpeed = self?.players[nativeId]?.playbackSpeed
                    continuation.resume(returning: playbackSpeed)
                }
            }
        }
        
        /**
         Set playback speed for nativeId's player.
         */
        AsyncFunction("setPlaybackSpeed") { (nativeId: String, playbackSpeed: Float) in
            await withCheckedContinuation { continuation in
                DispatchQueue.main.async { [weak self] in
                    self?.players[nativeId]?.playbackSpeed = playbackSpeed
                    continuation.resume()
                }
            }
        }
        
        /**
         Resolve nativeId's current ad state.
         */
        AsyncFunction("isAd") { (nativeId: String) -> Bool? in
            await withCheckedContinuation { continuation in
                DispatchQueue.main.async { [weak self] in
                    let isAd = self?.players[nativeId]?.isAd
                    continuation.resume(returning: isAd)
                }
            }
        }
        
        /**
         Set maximum selectable bitrate for nativeId's player.
         */
        AsyncFunction("setMaxSelectableBitrate") { (nativeId: String, maxBitrate: Int) in
            await withCheckedContinuation { continuation in
                DispatchQueue.main.async { [weak self] in
                    self?.players[nativeId]?.maxSelectableBitrate = maxBitrate
                    continuation.resume()
                }
            }
        }
        
        /**
         Resolve nativeId's AirPlay activation state (iOS only).
         */
        AsyncFunction("isAirPlayActive") { (nativeId: String) -> Bool? in
            await withCheckedContinuation { continuation in
                DispatchQueue.main.async { [weak self] in
#if os(iOS)
                    let isActive = self?.players[nativeId]?.isAirPlayActive
                    continuation.resume(returning: isActive)
#else
                    continuation.resume(returning: nil)
#endif
                }
            }
        }
        
        /**
         Resolve nativeId's AirPlay availability state (iOS only).
         */
        AsyncFunction("isAirPlayAvailable") { (nativeId: String) -> Bool? in
            await withCheckedContinuation { continuation in
                DispatchQueue.main.async { [weak self] in
#if os(iOS)
                    let isAvailable = self?.players[nativeId]?.isAirPlayAvailable
                    continuation.resume(returning: isAvailable)
#else
                    continuation.resume(returning: nil)
#endif
                }
            }
        }
        
        /**
         Resolve nativeId's cast availability state.
         */
        AsyncFunction("isCastAvailable") { (nativeId: String) -> Bool? in
            await withCheckedContinuation { continuation in
                DispatchQueue.main.async { [weak self] in
                    let isCastAvailable = self?.players[nativeId]?.isCastAvailable
                    continuation.resume(returning: isCastAvailable)
                }
            }
        }
        
        /**
         Resolve nativeId's current casting state.
         */
        AsyncFunction("isCasting") { (nativeId: String) -> Bool? in
            await withCheckedContinuation { continuation in
                DispatchQueue.main.async { [weak self] in
                    let isCasting = self?.players[nativeId]?.isCasting
                    continuation.resume(returning: isCasting)
                }
            }
        }
        
        /**
         Initiate casting for nativeId's player.
         */
        AsyncFunction("castVideo") { (nativeId: String) in
            await withCheckedContinuation { continuation in
                DispatchQueue.main.async { [weak self] in
                    self?.players[nativeId]?.castVideo()
                    continuation.resume()
                }
            }
        }
        
        /**
         Stop casting for nativeId's player.
         */
        AsyncFunction("castStop") { (nativeId: String) in
            await withCheckedContinuation { continuation in
                DispatchQueue.main.async { [weak self] in
                    self?.players[nativeId]?.castStop()
                    continuation.resume()
                }
            }
        }
        
        /**
         Skip current ad for nativeId's player.
         */
        AsyncFunction("skipAd") { (nativeId: String) in
            await withCheckedContinuation { continuation in
                DispatchQueue.main.async { [weak self] in
                    self?.players[nativeId]?.skipAd()
                    continuation.resume()
                }
            }
        }
        
        /**
         Check if player can play at specified playback speed (iOS only).
         */
        AsyncFunction("canPlayAtPlaybackSpeed") { (nativeId: String, playbackSpeed: Float) -> Bool? in
            await withCheckedContinuation { continuation in
                DispatchQueue.main.async { [weak self] in
                    let canPlay = self?.players[nativeId]?.canPlay(atPlaybackSpeed: playbackSpeed)
                    continuation.resume(returning: canPlay)
                }
            }
        }
        
        // TODO: Continue with more methods
    }
    
    // CRITICAL: This method must remain available for cross-module access
    // Called by BufferModule, PlayerAnalyticsModule, RNPlayerViewManager, etc.
    @objc
    public func retrieve(_ nativeId: NativeId) -> Player? {
        players[nativeId]
    }
}