import Foundation
import BitmovinPlayer

extension RCTConvert {
    /**
     Utility method to instantiate a `PlayerConfig` from a JS object.
     - Parameter json: JS object
     - Returns: The produced `Playerconfig` object
     */
    static func playerConfig(_ json: Any?) -> PlayerConfig? {
        let playerConfig = PlayerConfig()
        guard let json = json as? [String: Any?] else {
            return playerConfig
        }
        if let licenseKey = json["licenseKey"] as? String {
            playerConfig.key = licenseKey
        }
        /**
         Configures the playback behaviour of the player.
         */
        if let playbackConfig = json["playbackConfig"] as? [String: Any?] {
            /**
             * Specifies whether autoplay is enabled.
             *
             * Default is `false`.
             */
            if let isAutoplayEnabled = playbackConfig["isAutoplayEnabled"] as? Bool {
                playerConfig.playbackConfig.isAutoplayEnabled = isAutoplayEnabled
            }
            /**
             * Specifies if the player should start muted.
             *
             * Default is `false`.
             */
            if let isMuted = playbackConfig["isMuted"] as? Bool {
                playerConfig.playbackConfig.isMuted = isMuted
            }
            /**
             * Specifies if time shifting (during live streaming) should be enabled.
             *
             * Default is `true`.
             */
            if let isTimeShiftEnabled = playbackConfig["isTimeShiftEnabled"] as? Bool {
                playerConfig.playbackConfig.isTimeShiftEnabled = isTimeShiftEnabled
            }
            /**
             * Specifies if isBackgroundPlaybackEnabled should be enabled.
             *
             * Default is `false`.
             */
            if let isBackgroundPlaybackEnabled = playbackConfig["isBackgroundPlaybackEnabled"] as? Bool {
                playerConfig.playbackConfig.isBackgroundPlaybackEnabled = isBackgroundPlaybackEnabled
            }
            /**
             * Specifies if isPictureInPictureEnabled should be enabled.
             *
             * Default is `false`.
             */
            if let isPictureInPictureEnabled = playbackConfig["isPictureInPictureEnabled"] as? Bool {
                playerConfig.playbackConfig.isPictureInPictureEnabled = isPictureInPictureEnabled
            }
        }
        return playerConfig
    }
    
    /**
     Utility method to instantiate a `SourceConfig` from a JS object.
     - Parameter json: JS object
     - Returns: The produced `SourceConfig` object
     */
    static func sourceConfig(_ json: Any?) -> SourceConfig? {
        guard let json = json as? [String: Any?] else {
            return nil
        }
        let sourceConfig = SourceConfig(
            url: RCTConvert.nsurl(json["url"]),
            type: RCTConvert.sourceType(json["type"])
        )
        if let title = json["title"] as? String {
            sourceConfig.title = title
        }
        if let poster = json["poster"] as? String {
            sourceConfig.posterSource = RCTConvert.nsurl(poster)
        }
        if let isPosterPersistent = json["isPosterPersistent"] as? Bool {
            sourceConfig.isPosterPersistent = isPosterPersistent
        }
        return sourceConfig
    }
    
    /**
     Utility method to get a `SourceType` from a JS object.
     - Parameter json: JS object
     - Returns: The associated `SourceType` value
     */
    static func sourceType(_ json: Any?) -> SourceType {
        guard let json = json as? String else {
            return .none
        }
        switch json {
        case "none": return .none
        case "hls": return .hls
        case "dash": return .dash
        case "progressive": return .progressive
        default: return .none
        }
    }
    
    /**
     Utility method to get a `TimeMode` from a JS object.
     - Parameter json: JS object
     - Returns: The associated `TimeMode` value
     */
    static func timeMode(_ json: Any?) -> TimeMode {
        guard let json = json as? String else {
            return .absoluteTime
        }
        switch json {
        case "absolute": return .absoluteTime
        case "relative": return .relativeTime
        default: return .absoluteTime
        }
    }
}
