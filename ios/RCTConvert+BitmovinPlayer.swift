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
        if let playbackConfig = json["playbackConfig"] as? [String: Any?] {
            if let isAutoplayEnabled = playbackConfig["isAutoplayEnabled"] as? Bool {
                playerConfig.playbackConfig.isAutoplayEnabled = isAutoplayEnabled
            }
            if let isMuted = playbackConfig["isMuted"] as? Bool {
                playerConfig.playbackConfig.isMuted = isMuted
            }
            if let isTimeShiftEnabled = playbackConfig["isTimeShiftEnabled"] as? Bool {
                playerConfig.playbackConfig.isTimeShiftEnabled = isTimeShiftEnabled
            }
            if let isBackgroundPlaybackEnabled = playbackConfig["isBackgroundPlaybackEnabled"] as? Bool {
                playerConfig.playbackConfig.isBackgroundPlaybackEnabled = isBackgroundPlaybackEnabled
            }
            if let isPictureInPictureEnabled = playbackConfig["isPictureInPictureEnabled"] as? Bool {
                playerConfig.playbackConfig.isPictureInPictureEnabled = isPictureInPictureEnabled
            }
        }
        if let tweaksConfig = json["tweaksConfig"] as? [String: Any?] {
            if let isNativeHlsParsingEnabled = tweaksConfig["isNativeHlsParsingEnabled"] as? Bool {
                playerConfig.tweaksConfig.isNativeHlsParsingEnabled = isNativeHlsParsingEnabled
            }
            if let isCustomHlsLoadingEnabled = tweaksConfig["isCustomHlsLoadingEnabled"] as? Bool {
                playerConfig.tweaksConfig.isCustomHlsLoadingEnabled = isCustomHlsLoadingEnabled
            }
            if let timeChangedInterval = tweaksConfig["timeChangedInterval"] as? NSNumber {
                playerConfig.tweaksConfig.timeChangedInterval = timeChangedInterval.doubleValue
            }
            if let seekToEndThreshold = tweaksConfig["seekToEndThreshold"] as? NSNumber {
                playerConfig.tweaksConfig.seekToEndThreshold = seekToEndThreshold.doubleValue
            }
            if let playbackStartBehaviour = tweaksConfig["playbackStartBehaviour"] as? String {
                switch playbackStartBehaviour {
                case "relaxed":
                    playerConfig.tweaksConfig.playbackStartBehaviour = .relaxed
                case "aggressive":
                    playerConfig.tweaksConfig.playbackStartBehaviour = .aggressive
                default:
                    break
                }
            }
            if let unstallingBehaviour = tweaksConfig["unstallingBehaviour"] as? String {
                switch unstallingBehaviour {
                case "relaxed":
                    playerConfig.tweaksConfig.unstallingBehaviour = .relaxed
                case "aggressive":
                    playerConfig.tweaksConfig.unstallingBehaviour = .aggressive
                default:
                    break
                }
            }
        }
        return playerConfig
    }

    /**
     Utility method to instantiate a `SourceConfig` from a JS object.
     - Parameter json: JS object
     - Returns: The produced `SourceConfig` object
     */
    static func sourceConfig(_ json: Any?, drmConfig: FairplayConfig? = nil) -> SourceConfig? {
        guard let json = json as? [String: Any?] else {
            return nil
        }
        let sourceConfig = SourceConfig(
            url: RCTConvert.nsurl(json["url"]),
            type: RCTConvert.sourceType(json["type"])
        )
        if let drmConfig = drmConfig {
            sourceConfig.drmConfig = drmConfig
        }
        if let title = json["title"] as? String {
            sourceConfig.title = title
        }
        if let poster = json["poster"] as? String {
            sourceConfig.posterSource = RCTConvert.nsurl(poster)
        }
        if let isPosterPersistent = json["isPosterPersistent"] as? Bool {
            sourceConfig.isPosterPersistent = isPosterPersistent
        }
        if let subtitleTracks = json["subtitleTracks"] as? [[String: Any]] {
            subtitleTracks.forEach {
                if let track = RCTConvert.subtitleTrack($0) {
                    sourceConfig.add(subtitleTrack: track)
                }
            }
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

    /**
     Utility method to get a `FairplayConfig` from a JS object.
     - Parameter json: JS object
     - Returns: The generated `FairplayConfig` object
     */
    static func fairplayConfig(_ json: Any?) -> FairplayConfig? {
        guard
            let json = json as? [String: Any?],
            let fairplayJson = json["fairplay"] as? [String: Any?],
            let licenseURL = fairplayJson["licenseUrl"] as? String,
            let certificateURL = fairplayJson["certificateUrl"] as? String
        else {
            return nil
        }
        let fairplayConfig = FairplayConfig(
            license: URL(string: licenseURL),
            certificateURL: URL(string: certificateURL)!
        )
        if let licenseRequestHeaders = fairplayJson["licenseRequestHeaders"] as? [String: String] {
            fairplayConfig.licenseRequestHeaders = licenseRequestHeaders
        }
        if let certificateRequestHeaders = fairplayJson["certificateRequestHeaders"] as? [String: String] {
            fairplayConfig.certificateRequestHeaders = certificateRequestHeaders
        }
        return fairplayConfig
    }

    /**
     Utility method to get a `SubtitleTrack` instance from a JS object.
     - Parameter json: JS object.
     - Returns: The generated `SubtitleTrack`.
     */
    static func subtitleTrack(_ json: [String: Any]) -> SubtitleTrack? {
        guard
            let url = RCTConvert.nsurl(json["url"]),
            let label = json["label"] as? String
        else {
            return nil
        }

        let language = json["language"] as? String
        let isDefaultTrack = json["isDefault"] as? Bool ?? false
        let isForced = json["isForced"] as? Bool ?? false
        let identifier = json["identifier"] as? String ?? UUID().uuidString

        if let format = RCTConvert.subtitleFormat(json["format"]) {
            return SubtitleTrack(
                url: url,
                format: format,
                label: label,
                identifier: identifier,
                isDefaultTrack: isDefaultTrack,
                language: language,
                forced: isForced
            )
        }
        return SubtitleTrack(
            url: url,
            label: label,
            identifier: identifier,
            isDefaultTrack: isDefaultTrack,
            language: language,
            forced: isForced
        )
    }

    /**
     Utility method to get a `SubtitleFormat` value from a JS object.
     - Parameter json: JS object.
     - Returns: The associated `SubtitleFormat` value or nil.
     */
    static func subtitleFormat(_ json: Any?) -> SubtitleFormat? {
        guard let json = json as? String else {
            return nil
        }
        switch json {
        case "cea": return .cea
        case "vtt": return .webVtt
        case "ttml": return .ttml
        default: return nil
        }
    }

    /**
     Utility method to get a json dictionary value from a `SubtitleTrack` object.
     - Parameter subtitleTrack: The track to convert to json format.
     - Returns: The generated json dictionary.
     */
    static func subtitleTrackJson(_ subtitleTrack: SubtitleTrack?) -> [AnyHashable: Any]? {
        guard let subtitleTrack = subtitleTrack else {
            return nil
        }
        return [
            "url": subtitleTrack.url?.absoluteString,
            "label": subtitleTrack.label,
            "isDefault": subtitleTrack.isDefaultTrack,
            "identifier": subtitleTrack.identifier,
            "language": subtitleTrack.language,
            "isForced": subtitleTrack.isForced,
            "format": {
                switch subtitleTrack.format {
                case .cea: return "cea"
                case .webVtt: return "vtt"
                case .ttml: return "ttml"
                }
            }(),
        ]
    }
}
