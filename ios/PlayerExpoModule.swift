import BitmovinPlayer
import ExpoModulesCore

public class PlayerExpoModule: Module {
    /// In-memory mapping from `nativeId`s to `Player` instances.
    /// Must match the legacy PlayerModule's Registry pattern.
    private var players: Registry<Player> = [:]

    public func definition() -> ModuleDefinition {
        Name("PlayerExpoModule")

        OnCreate {
            // Module initialization
        }

        OnDestroy {
            // Destroy all players on the main thread when the module is deallocated.
            // This is necessary when the IMA SDK is present in the app,
            // as it may crash if the players are destroyed on a background thread.
            DispatchQueue.main.async { [players] in
                players.values.forEach { $0.destroy() }
            }
        }

        playerManagement()
        playerMethods()
        playerGetters()
        castingAndAds()
        initializationAndLoading()
    }

    @ModuleDefinitionBuilder
    private func playerManagement() -> [AnyDefinition] {
        /**
         Returns the count of active players for debugging purposes
         */
        Function("getPlayerCount") {
            players.count
        }

        /**
         Checks if a player with the given nativeId exists
         */
        Function("hasPlayer") { (nativeId: String) in
            players[nativeId] != nil
        }
    }

    @ModuleDefinitionBuilder
    private func playerMethods() -> [AnyDefinition] {
        /**
         Call .play() on nativeId's player.
         */
        AsyncFunction("play") { (nativeId: String) in
            self.players[nativeId]?.play()
        }.runOnQueue(.main)

        /**
         Call .pause() on nativeId's player.
         */
        AsyncFunction("pause") { (nativeId: String) in
            self.players[nativeId]?.pause()
        }.runOnQueue(.main)

        /**
         Call .mute() on nativeId's player.
         */
        AsyncFunction("mute") { (nativeId: String) in
            self.players[nativeId]?.mute()
        }.runOnQueue(.main)

        /**
         Call .unmute() on nativeId's player.
         */
        AsyncFunction("unmute") { (nativeId: String) in
            self.players[nativeId]?.unmute()
        }.runOnQueue(.main)

        /**
         Call .seek(time:) on nativeId's player.
         */
        AsyncFunction("seek") { (nativeId: String, time: Double) in
            self.players[nativeId]?.seek(time: time)
        }.runOnQueue(.main)

        /**
         Sets timeShift on nativeId's player.
         */
        AsyncFunction("timeShift") { (nativeId: String, offset: Double) in
            self.players[nativeId]?.timeShift = offset
        }.runOnQueue(.main)

        /**
         Call .destroy() on nativeId's player and remove from registry.
         */
        AsyncFunction("destroy") { (nativeId: String) in
            if let player = self.players[nativeId] {
                player.destroy()
                self.players[nativeId] = nil
            }
        }.runOnQueue(.main)

        /**
         Call .setVolume(volume:) on nativeId's player.
         */
        AsyncFunction("setVolume") { (nativeId: String, volume: Int) in
            self.players[nativeId]?.volume = volume
        }.runOnQueue(.main)

        /**
         Call .unload() on nativeId's player.
         */
        AsyncFunction("unload") { (nativeId: String) in
            self.players[nativeId]?.unload()
        }.runOnQueue(.main)

        /**
         Set playback speed for nativeId's player.
         */
        AsyncFunction("setPlaybackSpeed") { (nativeId: String, playbackSpeed: Float) in
            self.players[nativeId]?.playbackSpeed = playbackSpeed
        }.runOnQueue(.main)

        /**
         Set maximum selectable bitrate for nativeId's player.
         */
        AsyncFunction("setMaxSelectableBitrate") { (nativeId: String, maxBitrate: Int) in
            self.players[nativeId]?.maxSelectableBitrate = UInt(maxBitrate)
        }.runOnQueue(.main)
    }

    @ModuleDefinitionBuilder
    private func playerGetters() -> [AnyDefinition] {
        /**
         Resolve nativeId's current volume.
         */
        AsyncFunction("getVolume") { (nativeId: String) -> Int? in
            self.players[nativeId]?.volume
        }.runOnQueue(.main)

        /**
         Resolve nativeId's current time.
         */
        AsyncFunction("currentTime") { (nativeId: String, mode: String?) -> Double? in
            let player = self.players[nativeId]
            if let mode {
                return player?.currentTime(RCTConvert.timeMode(mode))
            } else {
                return player?.currentTime
            }
        }.runOnQueue(.main)

        /**
         Resolve nativeId's current playing state.
         */
        AsyncFunction("isPlaying") { (nativeId: String) -> Bool? in
            self.players[nativeId]?.isPlaying
        }.runOnQueue(.main)

        /**
         Resolve nativeId's current paused state.
         */
        AsyncFunction("isPaused") { (nativeId: String) -> Bool? in
            self.players[nativeId]?.isPaused
        }.runOnQueue(.main)

        /**
         Resolve nativeId's active source duration.
         */
        AsyncFunction("duration") { (nativeId: String) -> Double? in
            self.players[nativeId]?.duration
        }.runOnQueue(.main)

        /**
         Resolve nativeId's current muted state.
         */
        AsyncFunction("isMuted") { (nativeId: String) -> Bool? in
            self.players[nativeId]?.isMuted
        }.runOnQueue(.main)

        /**
         Resolve nativeId's current time shift value.
         */
        AsyncFunction("getTimeShift") { (nativeId: String) -> Double? in
            self.players[nativeId]?.timeShift
        }.runOnQueue(.main)

        /**
         Resolve nativeId's live stream state.
         */
        AsyncFunction("isLive") { (nativeId: String) -> Bool? in
            self.players[nativeId]?.isLive
        }.runOnQueue(.main)

        /**
         Resolve nativeId's maximum time shift value.
         */
        AsyncFunction("getMaxTimeShift") { (nativeId: String) -> Double? in
            self.players[nativeId]?.maxTimeShift
        }.runOnQueue(.main)

        /**
         Resolve nativeId's current playback speed.
         */
        AsyncFunction("getPlaybackSpeed") { (nativeId: String) -> Float? in
            self.players[nativeId]?.playbackSpeed
        }.runOnQueue(.main)

        /**
         Resolve nativeId's current ad state.
         */
        AsyncFunction("isAd") { (nativeId: String) -> Bool? in
            self.players[nativeId]?.isAd
        }.runOnQueue(.main)

        /**
         Check if player can play at specified playback speed (iOS only).
         */
        AsyncFunction("canPlayAtPlaybackSpeed") { (nativeId: String, playbackSpeed: Float) -> Bool? in
            self.players[nativeId]?.canPlay(atPlaybackSpeed: playbackSpeed)
        }.runOnQueue(.main)
    }

    @ModuleDefinitionBuilder
    private func castingAndAds() -> [AnyDefinition] {
        /**
         Resolve nativeId's AirPlay activation state (iOS only).
         */
        AsyncFunction("isAirPlayActive") { (nativeId: String) -> Bool? in
            #if os(iOS)
            return self.players[nativeId]?.isAirPlayActive
            #else
            return nil
            #endif
        }.runOnQueue(.main)

        /**
         Resolve nativeId's AirPlay availability state (iOS only).
         */
        AsyncFunction("isAirPlayAvailable") { (nativeId: String) -> Bool? in
            #if os(iOS)
            return self.players[nativeId]?.isAirPlayAvailable
            #else
            return nil
            #endif
        }.runOnQueue(.main)

        /**
         Resolve nativeId's cast availability state.
         */
        AsyncFunction("isCastAvailable") { (nativeId: String) -> Bool? in
            self.players[nativeId]?.isCastAvailable
        }.runOnQueue(.main)

        /**
         Resolve nativeId's current casting state.
         */
        AsyncFunction("isCasting") { (nativeId: String) -> Bool? in
            self.players[nativeId]?.isCasting
        }.runOnQueue(.main)

        /**
         Initiate casting for nativeId's player.
         */
        AsyncFunction("castVideo") { (nativeId: String) in
            self.players[nativeId]?.castVideo()
        }.runOnQueue(.main)

        /**
         Stop casting for nativeId's player.
         */
        AsyncFunction("castStop") { (nativeId: String) in
            self.players[nativeId]?.castStop()
        }.runOnQueue(.main)

        /**
         Skip current ad for nativeId's player.
         */
        AsyncFunction("skipAd") { (nativeId: String) in
            self.players[nativeId]?.skipAd()
        }.runOnQueue(.main)
    }

    @ModuleDefinitionBuilder
    private func initializationAndLoading() -> [AnyDefinition] {
        /**
         Creates a new Player instance using the provided config.
         This is a complex method requiring config conversion and cross-module setup.
         */
        AsyncFunction("initWithConfig") { (nativeId: String, _: [String: Any]?, _: String?, _: String?) in
            guard self.players[nativeId] == nil else {
                // Player already exists for this nativeId
                return
            }

            // For now, create a basic player config - full conversion would require RCTConvert
            // This is a simplified implementation that creates a default player
            let playerConfig = PlayerConfig()

            // TODO: Add full config conversion when RCTConvert patterns are available
            // TODO: Add network config setup if networkNativeId is provided
            // TODO: Add remote control config setup for iOS

            self.players[nativeId] = PlayerFactory.create(playerConfig: playerConfig)
        }.runOnQueue(.main)

        // swiftlint:disable:next line_length
        AsyncFunction("initWithAnalyticsConfig") { (nativeId: String, _: [String: Any], _: [String: Any]?, _: [String: Any]?, _: String?) in
            guard self.players[nativeId] == nil else {
                // Player already exists for this nativeId
                return
            }

            // For now, create a basic player config with analytics
            let playerConfig = PlayerConfig()

            // TODO: Add full analytics config conversion
            // TODO: Add network config setup if networkNativeId is provided

            self.players[nativeId] = PlayerFactory.create(playerConfig: playerConfig)
        }.runOnQueue(.main)

        /**
         Load source into the player.
         This requires cross-module dependency on SourceModule.
         */
        AsyncFunction("loadSource") { (nativeId: String, _: String) in
            guard self.players[nativeId] != nil else {
                return
            }

            // TODO: This requires SourceModule dependency to retrieve source
            // For now, this is a placeholder implementation
            // Need: let source = self?.bridge[SourceModule.self]?.retrieve(sourceNativeId)
            // Then: player.load(source: source)

            // Placeholder - would load source if SourceModule integration is available
        }.runOnQueue(.main)
    }

    // CRITICAL: This method must remain available for cross-module access
    // Called by BufferModule, PlayerAnalyticsModule, RNPlayerViewManager, etc.
    @objc
    public func retrieve(_ nativeId: NativeId) -> Player? {
        players[nativeId]
    }
}
