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
        if let playbackConfig = RCTConvert.playbackConfig(json["playbackConfig"]) {
            playerConfig.playbackConfig = playbackConfig
        }
        if let styleConfig = RCTConvert.styleConfig(json["styleConfig"]) {
            playerConfig.styleConfig = styleConfig
        }
        if let tweaksConfig = RCTConvert.tweaksConfig(json["tweaksConfig"]) {
            playerConfig.tweaksConfig = tweaksConfig
        }
        if let tempAdConfig = RCTConvert.tempAngelAdConfig(json["tempAngelAdConfig"]) {
            playerConfig.advertisingConfig = tempAdConfig
        }
        return playerConfig
    }

    static func tempAngelAdConfig(_ json: Any?) -> AdvertisingConfig? {
        guard let json = json as? [String: Any?] else {
            return nil
        }
        var adConfig = AdvertisingConfig()
        if let adSourceUrl = json["adSourceUrl"] as? String {
            if let adUrl = URL(string: adSourceUrl) {
                let adSource = AdSource(tag: adUrl, ofType: .ima)
                let adItem = AdItem(adSources: [adSource])

                adConfig = AdvertisingConfig(schedule: [adItem])
            }
        }

        return adConfig
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
     Utility method to instantiate a `StyleConfig` from a JS object.
     - Parameter json: JS object.
     - Returns: The produced `StyleConfig` object.
     */
    static func styleConfig(_ json: Any?) -> StyleConfig? {
        guard let json = json as? [String: Any?] else {
            return nil
        }
        let styleConfig = StyleConfig()
        if let isUiEnabled = json["isUiEnabled"] as? Bool {
            styleConfig.isUiEnabled = isUiEnabled
        }
        if let userInterfaceType = json["userInterfaceType"] as? String {
            switch userInterfaceType {
            case "bitmovin":
                styleConfig.userInterfaceType = .bitmovin
            case "system":
                styleConfig.userInterfaceType = .system
            case "subtitle":
                styleConfig.userInterfaceType = .subtitle
            default:
                break
            }
        }
        if let playerUiCss = json["playerUiCss"] as? String {
            styleConfig.playerUiCss = RCTConvert.nsurl(playerUiCss)
        }
        if let supplementalPlayerUiCss = json["supplementalPlayerUiCss"] as? String {
            styleConfig.supplementalPlayerUiCss = RCTConvert.nsurl(supplementalPlayerUiCss)
        }
        if let playerUiJs = json["playerUiJs"] as? String {
            styleConfig.playerUiJs = RCTConvert.nsurl(playerUiJs)
        }
        if let scalingMode = json["scalingMode"] as? String {
            switch scalingMode {
            case "Fit":
                styleConfig.scalingMode = .fit
            case "Stretch":
                styleConfig.scalingMode = .stretch
            case "Zoom":
                styleConfig.scalingMode = .zoom
            default:
                styleConfig.scalingMode = .fit
                break
            }
        }
        return styleConfig
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
     Utility method to compute a JS value from a `SourceConfig` object.
     - Parameter sourceConfig: `SourceConfig` object to be converted.
     - Returns: The produced JS object.
     */
    static func toJson(sourceConfig: SourceConfig?) -> [String: Any?]? {
        guard let sourceConfig = sourceConfig else {
            return nil
        }
        return [
            "url": sourceConfig.url.absoluteString,
            "type": RCTConvert.toJson(sourceType: sourceConfig.type),
            "title": sourceConfig.title,
            "poster": sourceConfig.posterSource?.absoluteString,
            "isPosterPersistent": sourceConfig.isPosterPersistent
        ]
    }

    /**
     Utility method to compute a JS value from a `SourceType` object.
     - Parameter sourceType: `Sourcetype` object to be converted.
     - Returns: The produced JS object.
     */
    static func toJson(sourceType: SourceType?) -> String? {
        guard let sourceType = sourceType else {
            return nil
        }
        switch sourceType {
        case .none: return "none"
        case .hls: return "hls"
        case .dash: return "dash"
        case .progressive: return "progressive"
        default: return "none"
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
     Utility method to get a json dictionary value from a `AudioTrack` object.
     - Parameter audioTrack: The track to convert to json format.
     - Returns: The generated json dictionary.
     */
    static func audioTrackJson(_ audioTrack: AudioTrack?) -> [AnyHashable: Any]? {
        guard let audioTrack = audioTrack else {
            return nil
        }
        return [
            "url": audioTrack.url?.absoluteString,
            "label": audioTrack.label,
            "isDefault": audioTrack.isDefaultTrack,
            "identifier": audioTrack.identifier,
            "language": audioTrack.language
        ]
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

    // --- Temp Ad Converts --- //

    static func adJson(_ ad: Ad?) -> [AnyHashable: Any]? {
        guard let ad = ad else {
            return nil
        }

        return [
            "clickThroughUrl": ad.clickThroughUrl?.absoluteString,
            "data": RCTConvert.adDataJson(ad.data),
            "height": ad.height,
            "width": ad.width,
            "id": ad.identifier,
            "isLinear": ad.isLinear,
            "mediaFileUrl": ad.mediaFileUrl?.absoluteString
        ]
    }

    static func adDataJson(_ adData: AdData?) -> [AnyHashable: Any]? {
        guard let adData = adData else {
            return nil
        }

        return [
            "bitrate": adData.bitrate,
            "maxBitrate": adData.maxBitrate,
            "minBitrate": adData.minBitrate,
            "mimeType": adData.mimeType
        ]
    }

    static func adSourceTypeJson(_ adSourceType: AdSourceType?) -> String? {
        guard let adSourceType = adSourceType else {
            return nil
        }

        switch adSourceType {
        case .ima: return "Ima"
        case .progressive: return "Progressive"
        case .unknown: return "Uknown"
        default: return "Unknown"
        }
    }

    static func adQuartileJson(_ adQuartile: AdQuartile?) -> [AnyHashable: Any]? {
        guard let adQuartile = adQuartile else {
            return nil
        }

        return [
            "percentage": {
                switch adQuartile {
                case .firstQuartile: return 0.25
                case .midpoint: return 0.50
                case .thirdQuartile: return 0.75
                }
            }()
        ]
    }

    static func adBreakJson(_ adBreak: AdBreak?) -> [AnyHashable: Any]? {
        guard let adBreak = adBreak else {
            return nil
        }

        return [
            "id": adBreak.identifier,
            "scheduleTime": adBreak.scheduleTime,
            "ads": adBreak.ads.map { RCTConvert.adJson($0) }
        ]
    }

    static func adConfigJson(_ adConfig: AdConfig?) -> [AnyHashable: Any]? {
        guard let adConfig = adConfig else {
            return nil
        }

        return [
            "replaceContentDuration": adConfig.replaceContentDuration
        ]
    }

    static func adItemJson(_ adItem: AdItem?) -> [AnyHashable: Any]? {
        guard let adItem = adItem else {
            return nil
        }

        return [
            "sources": adItem.sources.map { RCTConvert.adSourceJson($0) },
            "position": adItem.position
        ]
    }

    static func adSourceJson(_ adSource: AdSource?) -> [AnyHashable: Any]? {
        guard let adSource = adSource else {
            return nil
        }

        return [
            "tag": adSource.tag,
            "type": RCTConvert.adSourceTypeJson(adSource.type)
        ]
    }

    /**
     Utility method to compute a JS value from an `OfflineState` object.
     - Parameter offlineState `OfflineState` object to be converted.
     - Returns: The produced JS object.
     */
    static func toJson(offlineState: OfflineState?) -> String {
        var notDownloaded = "NotDownloaded"
        guard let offlineState = offlineState else {
            return notDownloaded
        }

        switch offlineState {
        case .downloading: return "Downloading"
        case .downloaded: return "Downloaded"
        case .suspended: return "Suspended"
        default: return notDownloaded
        }
    }

    /**
     Utility method to compute a JS value from an `OfflineTextTrack` object.
     - Parameter offlineTrack `OfflineTextTrack` object to be converted.
     - Returns: The produced JS object.
     */
    static func toJson(offlineTrack: OfflineTextTrack) -> [String: Any?] {
        return [
            "id": offlineTrack.label,
            "language": offlineTrack.language,
        ]
    }

    /**
     Utility method to compute a JS value from an `OfflineAudioTrack` object.
     - Parameter offlineTrack `OfflineAudioTrack` object to be converted.
     - Returns: The produced JS object.
     */
    static func toJson(offlineTrack: OfflineAudioTrack) -> [String: Any?] {
        return [
            "id": offlineTrack.label,
            "language": offlineTrack.language,
        ]
    }

    /**
     Utility method to compute a JS value from an `OfflineTrackSelection` object.
     - Parameter offlineTracks `OfflineTrackSelection` object to be converted.
     - Returns: The produced JS object.
     */
    static func toJson(offlineTracks: OfflineTrackSelection?) -> [String: Any?]? {
        guard let offlineTracks = offlineTracks else {
            return nil
        }

        return [
            "textOptions": offlineTracks.textTracks.map({ RCTConvert.toJson(offlineTrack: $0) }),
            "audioOptions": offlineTracks.audioTracks.map({ RCTConvert.toJson(offlineTrack: $0) })
        ]
    }
}
