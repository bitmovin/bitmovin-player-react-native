import Foundation
import BitmovinPlayer
import BitmovinAnalyticsCollector

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
        if let playbackConfig = RCTConvert.playbackConfig(json["playbackConfig"]) {
            playerConfig.playbackConfig = playbackConfig
        }
        if let tweaksConfig = RCTConvert.tweaksConfig(json["tweaksConfig"]) {
            playerConfig.tweaksConfig = tweaksConfig
        }
        if let advertisingConfig = RCTConvert.advertisingConfig(json["advertisingConfig"]) {
            playerConfig.advertisingConfig = advertisingConfig
        }
        return playerConfig
    }

    /**
     Utility method to instantiate a `PlaybackConfig` from a JS object.
     - Parameter json: JS object.
     - Returns: The produced `PlaybackConfig` object.
     */
    static func playbackConfig(_ json: Any?) -> PlaybackConfig? {
        guard let json = json as? [String: Any?] else {
            return nil
        }
        let playbackConfig = PlaybackConfig()
        if let isAutoplayEnabled = json["isAutoplayEnabled"] as? Bool {
            playbackConfig.isAutoplayEnabled = isAutoplayEnabled
        }
        if let isMuted = json["isMuted"] as? Bool {
            playbackConfig.isMuted = isMuted
        }
        if let isTimeShiftEnabled = json["isTimeShiftEnabled"] as? Bool {
            playbackConfig.isTimeShiftEnabled = isTimeShiftEnabled
        }
        if let isBackgroundPlaybackEnabled = json["isBackgroundPlaybackEnabled"] as? Bool {
            playbackConfig.isBackgroundPlaybackEnabled = isBackgroundPlaybackEnabled
        }
        if let isPictureInPictureEnabled = json["isPictureInPictureEnabled"] as? Bool {
            playbackConfig.isPictureInPictureEnabled = isPictureInPictureEnabled
        }
        return playbackConfig
    }

    /**
     Utility method to instantiate a `TweaksConfig` from a JS object.
     - Parameter json: JS object.
     - Returns: The produced `TweaksConfig` object.
     */
    static func tweaksConfig(_ json: Any?) -> TweaksConfig? {
        guard let json = json as? [String: Any?] else {
            return nil
        }
        let tweaksConfig = TweaksConfig()
        if let isNativeHlsParsingEnabled = json["isNativeHlsParsingEnabled"] as? Bool {
            tweaksConfig.isNativeHlsParsingEnabled = isNativeHlsParsingEnabled
        }
        if let isCustomHlsLoadingEnabled = json["isCustomHlsLoadingEnabled"] as? Bool {
            tweaksConfig.isCustomHlsLoadingEnabled = isCustomHlsLoadingEnabled
        }
        if let timeChangedInterval = json["timeChangedInterval"] as? NSNumber {
            tweaksConfig.timeChangedInterval = timeChangedInterval.doubleValue
        }
        if let seekToEndThreshold = json["seekToEndThreshold"] as? NSNumber {
            tweaksConfig.seekToEndThreshold = seekToEndThreshold.doubleValue
        }
        if let playbackStartBehaviour = json["playbackStartBehaviour"] as? String {
            switch playbackStartBehaviour {
            case "relaxed":
                tweaksConfig.playbackStartBehaviour = .relaxed
            case "aggressive":
                tweaksConfig.playbackStartBehaviour = .aggressive
            default:
                break
            }
        }
        if let unstallingBehaviour = json["unstallingBehaviour"] as? String {
            switch unstallingBehaviour {
            case "relaxed":
                tweaksConfig.unstallingBehaviour = .relaxed
            case "aggressive":
                tweaksConfig.unstallingBehaviour = .aggressive
            default:
                break
            }
        }
        return tweaksConfig
    }

    /**
     Utility method to instantiate an `AdvertisingConfig` from a JS object.
     - Parameter json: JS object.
     - Returns: The produced `AdvertisingConfig` object.
     */
    static func advertisingConfig(_ json: Any?) -> AdvertisingConfig? {
        guard
            let json = json as? [String: Any?],
            let schedule = json["schedule"] as? [[String: Any?]]
        else {
            return nil
        }
        return AdvertisingConfig(schedule: schedule.compactMap { RCTConvert.adItem($0) })
    }

    /**
     Utility method to instantiate an `AdItem` from a JS object.
     - Parameter json: JS object.
     - Returns: The produced `AdItem` object.
     */
    static func adItem(_ json: Any?) -> AdItem? {
        guard
            let json = json as? [String: Any?],
            let sources = json["sources"] as? [[String: Any?]]
        else {
            return nil
        }
        return AdItem(
            adSources: sources.compactMap { RCTConvert.adSource($0) },
            atPosition: json["position"] as? String
        )
    }

    /**
     Utility method to instantiate an `AdSource` from a JS object.
     - Parameter json: JS object.
     - Returns: The produced `AdSource` object.
     */
    static func adSource(_ json: Any?) -> AdSource? {
        guard
            let json = json as? [String: Any?],
            let tag = RCTConvert.nsurl(json["tag"]),
            let type = RCTConvert.adSourceType(json["type"])
        else {
            return nil
        }
        return AdSource(tag: tag, ofType: type)
    }

    /**
     Utility method to instantiate an `AdSourceType` from a JS object.
     - Parameter json: JS object.
     - Returns: The produced `AdSourceType` object.
     */
    static func adSourceType(_ json: Any?) -> AdSourceType? {
        guard let json = json as? String else {
            return nil
        }
        switch json {
        case "ima":
            return .ima
        case "unknown":
            return .unknown
        case "progressive":
            return .progressive
        default:
            return nil
        }
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
        if let thumbnailTrack = json["thumbnailTrack"] as? String {
            sourceConfig.thumbnailTrack = RCTConvert.thumbnailTrack(thumbnailTrack)
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
     Utility method to get a `ThumbnailTrack` instance from a JS object.
     - Parameter url: String.
     - Returns: The generated `ThumbnailTrack`.
     */
    static func thumbnailTrack(_ url: String?) -> ThumbnailTrack? {
        guard
            let url = RCTConvert.nsurl(url)
        else {
            return nil
        }
        return ThumbnailTrack(
            url: url,
            label: "Thumbnails",
            identifier: UUID().uuidString,
            isDefaultTrack: false
        )
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

    /**
     Utility method to compute a JS value from an `AdItem` object.
     - Parameter adItem: `AdItem` object to be converted.
     - Returns: The produced JS object.
     */
    static func toJson(adItem: AdItem?) -> [String: Any?]? {
        guard let adItem = adItem else {
            return nil
        }
        return [
            "position": adItem.position,
            "sources": adItem.sources.compactMap { RCTConvert.toJson(adSource: $0) }
        ]
    }

    /**
     Utility method to compute a JS value from an `AdSource` object.
     - Parameter adSource: `AdSource` object to be converted.
     - Returns: The produced JS object.
     */
    static func toJson(adSource: AdSource?) -> [String: Any?]? {
        guard let adSource = adSource else {
            return nil
        }
        return [
            "tag": adSource.tag,
            "type": RCTConvert.toJson(adSourceType: adSource.type)
        ]
    }

    /**
     Utility method to compute a JS value from an `AdSourceType` value.
     - Parameter adSourceType: `AdSourceType` object to be converted.
     - Returns: The produced JS object.
     */
    static func toJson(adSourceType: AdSourceType?) -> String? {
        guard let adSourceType = adSourceType else {
            return nil
        }
        switch adSourceType {
        case .ima:
            return "ima"
        case .unknown:
            return "unknown"
        case .progressive:
            return "progressive"
        default:
            return nil
        }
    }

    /**
     Utility method to compute a JS value from an `AdConfig` object.
     - Parameter adConfig: `AdConfig` object to be converted.
     - Returns: The produced JS object.
     */
    static func toJson(adConfig: AdConfig?) -> [String: Any?]? {
        guard let adConfig = adConfig else {
            return nil
        }
        return ["replaceContentDuration": adConfig.replaceContentDuration]
    }

    /**
     Utility method to compute a JS string from an `AdQuartile` value.
     - Parameter adQuartile: `AdQuartile` value to be converted.
     - Returns: The produced JS string.
     */
    static func toJson(adQuartile: AdQuartile?) -> String? {
        guard let adQuartile = adQuartile else {
            return nil
        }
        switch adQuartile {
        case .firstQuartile:
            return "first"
        case .midpoint:
            return "mid_point"
        case .thirdQuartile:
            return "third"
        }
    }

    /**
     Utility method to compute a JS value from an `AdBreak` object.
     - Parameter adBreak: `AdBreak` object to be converted.
     - Returns: The produced JS object.
     */
    static func toJson(adBreak: AdBreak?) -> [String: Any?]? {
        guard let adBreak = adBreak else {
            return nil
        }
        return [
            "ads": adBreak.ads.compactMap { RCTConvert.toJson(ad: $0) },
            "id": adBreak.identifier,
            "scheduleTime": adBreak.scheduleTime
        ]
    }

    /**
     Utility method to compute a JS value from an `Ad` object.
     - Parameter ad: `Ad` object to be converted.
     - Returns: The produced JS object.
     */
    static func toJson(ad: Ad?) -> [String: Any?]? {
        guard let ad = ad else {
            return nil
        }
        return [
            "clickThroughUrl": ad.clickThroughUrl?.absoluteString,
            "data": RCTConvert.toJson(adData: ad.data),
            "height": ad.height,
            "id": ad.identifier,
            "isLinear": ad.isLinear,
            "mediaFileUrl": ad.mediaFileUrl?.absoluteString,
            "width": ad.width
        ]
    }

    /**
     Utility method to compute a JS value from an `AdData` object.
     - Parameter adData `AdData` object to be converted.
     - Returns: The produced JS object.
     */
    static func toJson(adData: AdData?) -> [String: Any?]? {
        guard let adData = adData else {
            return nil
        }
        return [
            "bitrate": adData.bitrate,
            "maxBitrate": adData.maxBitrate,
            "mimeType": adData.mimeType,
            "minBitrate": adData.minBitrate
        ]
    }

    /**
     Utility method to get a `BitmovinAnalyticsConfig` value from a JS object.
     - Parameter json: JS object.
     - Returns: The associated `BitmovinAnalyticsConfig` value or nil.
     */
    static func analyticsConfig(_ json: Any?) -> BitmovinAnalyticsConfig? {
        guard
            let json = json as? [String: Any?],
            let key = json["key"] as? String
        else {
            return nil
        }
        var config = BitmovinAnalyticsConfig(key: key)
        if let playerKey = json["playerKey"] as? String {
            config = BitmovinAnalyticsConfig(key: key, playerKey: playerKey)
        }
        if let cdnProvider = json["cdnProvider"] as? String {
            config.cdnProvider = cdnProvider
        }
        if let customerUserId = json["customUserId"] as? String {
            config.customerUserId = customerUserId
        }
        if let experimentName = json["experimentName"] as? String {
            config.experimentName = experimentName
        }
        if let videoId = json["videoId"] as? String {
            config.videoId = videoId
        }
        if let title = json["title"] as? String {
            config.title = title
        }
        if let path = json["path"] as? String {
            config.path = path
        }
        if let isLive = json["isLive"] as? Bool {
            config.isLive = isLive
        }
        if let ads = json["ads"] as? Bool {
            config.ads = ads
        }
        if let randomizeUserId = json["randomizeUserId"] as? Bool {
            config.randomizeUserId = randomizeUserId
        }
        for n in 1..<30 {
            if let customDataN = json["customData\(n)"] as? String {
                config.setValue(customDataN, forKey: "customData\(n)")
            }
        }
        return config
    }

    /**
     Utility method to get an analytics `CustomData` value from a JS object.
     - Parameter json: JS object.
     - Returns: The associated `CustomData` value or nil.
     */
    static func analyticsCustomData(_ json: Any?) -> CustomData? {
        guard let json = json as? [String: Any?] else {
            return nil
        }
        let customData = CustomData()
        for n in 1..<30 {
            if let customDataN = json["customData\(n)"] as? String {
                customData.setValue(customDataN, forKey: "customData\(n)")
            }
        }
        return customData
    }

    /**
     Utility method to get a JS value from a `CustomData` object.
     - Parameter analyticsCustomData: Analytics custom data object.
     - Returns: The JS value representing the given object.
     */
    static func toJson(analyticsCustomData: CustomData?) -> [String: Any?]? {
        guard let analyticsCustomData = analyticsCustomData else {
            return nil
        }
        var json: [String: Any?] = [:]
        for n in 1..<30 {
            if let customDataN = analyticsCustomData.value(forKey: "customData\(n)") {
                json["customData\(n)"] = customDataN
            }
        }
        return json
    }

    /**
     Utility method to compute a JS value from a `VideoQuality` object.
     - Parameter videoQuality `VideoQuality` object to be converted.
     - Returns: The produced JS object.
     */
    static func toJson(videoQuality: VideoQuality?) -> [String: Any?]? {
        guard let videoQuality = videoQuality else {
            return nil
        }
        return [
            "id": videoQuality.identifier,
            "label": videoQuality.label,
            "height": videoQuality.height,
            "width": videoQuality.width,
            "codec": videoQuality.codec,
            "bitrate": videoQuality.bitrate,
        ]
    }
}
