// swiftlint:disable file_length

import BitmovinCollector
import BitmovinPlayer
import Foundation

extension RCTConvert {
    static func playerConfig(_ json: Any?) -> PlayerConfig? { // swiftlint:disable:this cyclomatic_complexity
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
        if let advertisingConfig = RCTConvert.advertisingConfig(json["advertisingConfig"]) {
            playerConfig.advertisingConfig = advertisingConfig
        }
        if let adaptationConfig = RCTConvert.adaptationConfig(json["adaptationConfig"]) {
            playerConfig.adaptationConfig = adaptationConfig
        }
        if let bufferConfig = RCTConvert.bufferConfig(json["bufferConfig"]) {
            playerConfig.bufferConfig = bufferConfig
        }
        if let liveConfig = RCTConvert.liveConfig(json["liveConfig"]) {
            playerConfig.liveConfig = liveConfig
        }
        if let networkConfig = RCTConvert.networkConfig(json["networkConfig"]) {
            playerConfig.networkConfig = networkConfig
        }
        if let nowPlayingConfig = RCTConvert.mediaControlConfig(json["mediaControlConfig"]) {
            playerConfig.nowPlayingConfig = nowPlayingConfig
        }
#if os(iOS)
        if let remoteControlConfig = RCTConvert.remoteControlConfig(json["remoteControlConfig"]) {
            playerConfig.remoteControlConfig = remoteControlConfig
        }
#endif
        return playerConfig
    }

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

    static func styleConfig(_ json: Any?) -> StyleConfig? { // swiftlint:disable:this cyclomatic_complexity
        guard let json = json as? [String: Any?] else {
            return nil
        }
        let styleConfig = StyleConfig()
        if let isUiEnabled = json["isUiEnabled"] as? Bool {
            styleConfig.isUiEnabled = isUiEnabled
        }
        if let userInterfaceType = userInterfaceType(json["userInterfaceType"]) {
            styleConfig.userInterfaceType = userInterfaceType
        }
#if !os(tvOS)
        if let playerUiCss = json["playerUiCss"] as? String {
            styleConfig.playerUiCss = RCTConvert.nsurl(playerUiCss)
        }
        if let supplementalPlayerUiCss = json["supplementalPlayerUiCss"] as? String {
            styleConfig.supplementalPlayerUiCss = RCTConvert.nsurl(supplementalPlayerUiCss)
        }
        if let playerUiJs = json["playerUiJs"] as? String {
            styleConfig.playerUiJs = RCTConvert.nsurl(playerUiJs)
        }
#endif
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
            }
        }
        return styleConfig
    }

    static func tweaksConfig(_ json: Any?) -> TweaksConfig? { // swiftlint:disable:this cyclomatic_complexity
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
#if !os(tvOS)
        if let updatesNowPlayingInfoCenter = json["updatesNowPlayingInfoCenter"] as? Bool {
            tweaksConfig.updatesNowPlayingInfoCenter = updatesNowPlayingInfoCenter
        }
#endif
        return tweaksConfig
    }

    static func bufferMediaTypeConfig(_ json: Any?) -> BufferMediaTypeConfig? {
        guard let json = json as? [String: Any?] else {
            return nil
        }
        let bufferMediaTypeConfig = BufferMediaTypeConfig()
        if let forwardDuration = json["forwardDuration"] as? NSNumber {
            bufferMediaTypeConfig.forwardDuration = forwardDuration.doubleValue
        }
        return bufferMediaTypeConfig
    }

    static func bufferConfig(_ json: Any?) -> BufferConfig? {
        guard let json = json as? [String: Any?] else {
            return nil
        }
        let bufferConfig = BufferConfig()
        if let bufferMediaTypeConfig = bufferMediaTypeConfig(json["audioAndVideo"]) {
            bufferConfig.audioAndVideo = bufferMediaTypeConfig
        }
        return bufferConfig
    }

    static func liveConfig(_ json: Any?) -> LiveConfig? {
        guard let json = json as? [String: Any?] else {
            return nil
        }
        let liveConfig = LiveConfig()
        if let minTimeshiftBufferDepth = json["minTimeshiftBufferDepth"] as? NSNumber {
            liveConfig.minTimeshiftBufferDepth = minTimeshiftBufferDepth.doubleValue
        }
        return liveConfig
    }

    static func httpRequest(_ json: Any?) -> HttpRequest? {
        guard
            let json = json as? [String: Any?],
            let url = RCTConvert.nsurl(json["url"]),
            let method = json["method"] as? String,
            let headers = json["headers"] as? [String: String]
        else {
            return nil
        }
        var request = HttpRequest(url: url, method: method)
        request.headers = headers

        if let bodyBase64EncodedString = json["body"] as? String {
            request.body = Data(base64Encoded: bodyBase64EncodedString)
        }

        return request
    }

    static func httpResponse(_ json: Any?) -> HttpResponse? {
        guard
            let json = json as? [String: Any?],
            let request = RCTConvert.httpRequest(json["request"]),
            let url = RCTConvert.nsurl(json["url"]),
            let status = json["status"] as? Int,
            let headers = json["headers"] as? [String: String]
        else {
            return nil
        }

        var body: Data?
        if let bodyBase64EncodedString = json["body"] as? String {
            body = Data(base64Encoded: bodyBase64EncodedString)
        }

        return HttpResponse(
            request: request,
            url: url,
            status: status,
            headers: headers,
            body: body
        )
    }

    static func networkConfig(_ json: Any?) -> NetworkConfig? {
        guard let json = json as? [String: Any?] else {
            return nil
        }
        return NetworkConfig()
    }

    static func advertisingConfig(_ json: Any?) -> AdvertisingConfig? {
        guard
            let json = json as? [String: Any?],
            let schedule = json["schedule"] as? [[String: Any?]]
        else {
            return nil
        }
        return AdvertisingConfig(schedule: schedule.compactMap { RCTConvert.adItem($0) })
    }

    static func imaSettingsDictionary(_ settings: ImaSettings) -> [String: Any] {
        var map: [String: Any] = [
            "language": settings.language,
            "maxRedirects": Int(settings.maxRedirects),
            "enableBackgroundPlayback": settings.enableBackgroundPlayback,
            "ppid": settings.ppid,
            "playerVersion": settings.playerVersion,
            "sessionId": settings.sessionId
        ]
#if !os(tvOS)
        map["sameAppKeyEnabled"] = settings.sameAppKeyEnabled
#endif
        return map
    }

    static func applyImaSettings(_ settings: ImaSettings, from json: [String: Any]) {
        if let ppid = json["ppid"] as? String {
            settings.ppid = ppid
        }
        if let language = json["language"] as? String {
            settings.language = language
        }
        if let redirects = json["maxRedirects"] as? NSNumber {
            settings.maxRedirects = redirects.uintValue
        }
        if let enableBackgroundPlayback = json["enableBackgroundPlayback"] as? Bool {
            settings.enableBackgroundPlayback = enableBackgroundPlayback
        }
        if let playerVersion = json["playerVersion"] as? String {
            settings.playerVersion = playerVersion
        }
        if let sessionId = json["sessionId"] as? String {
            settings.sessionId = sessionId
        }
#if !os(tvOS)
        if let sameAppKeyEnabled = json["sameAppKeyEnabled"] as? Bool {
            settings.sameAppKeyEnabled = sameAppKeyEnabled
        }
#endif
    }

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

    static func sourceConfig(_ json: Any?, drmConfig: DrmConfig? = nil) -> SourceConfig? { // swiftlint:disable:this cyclomatic_complexity line_length
        guard let json = json as? [String: Any?] else {
            return nil
        }
        let sourceConfig = SourceConfig(
            url: RCTConvert.nsurl(json["url"]),
            type: RCTConvert.sourceType(json["type"])
        )
        if let drmConfig {
            sourceConfig.drmConfig = drmConfig
        }
        if let title = json["title"] as? String {
            sourceConfig.title = title
        }
        if let description = json["description"] as? String {
            sourceConfig.sourceDescription = description
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
        if let metadata = json["metadata"] as? [String: String] {
            sourceConfig.metadata = metadata
        }
        if let options = json["options"] as? [String: Any] {
            sourceConfig.options = RCTConvert.sourceOptions(options)
        }
        return sourceConfig
    }

    static func sourceOptions(_ json: Any?) -> SourceOptions {
        let sourceOptions = SourceOptions()
        guard let json = json as? [String: Any?] else {
            return sourceOptions
        }
        if let startOffset = json["startOffset"] as? NSNumber {
            sourceOptions.startOffset = startOffset.doubleValue
        }
        sourceOptions.startOffsetTimelineReference = RCTConvert
            .timelineReferencePoint(json["startOffsetTimelineReference"])
        return sourceOptions
    }

    static func timelineReferencePoint(_ json: Any?) -> TimelineReferencePoint {
        guard let stringValue = json as? String else { return .auto }
        switch stringValue {
        case "start":
            return .start
        case "end":
            return .end
        default:
            return .auto
        }
    }

    static func sourceType(_ json: Any?) -> SourceType {
        guard let json = json as? String else {
            return .none
        }
        switch json {
        case "none":
            return .none
        case "hls":
            return .hls
        case "dash":
            return .dash
        case "progressive":
            return .progressive
        default:
            return .none
        }
    }

    static func timeMode(_ json: Any?) -> TimeMode {
        guard let json = json as? String else {
            return .absoluteTime
        }
        switch json {
        case "absolute":
            return .absoluteTime
        case "relative":
            return .relativeTime
        default:
            return .absoluteTime
        }
    }

    static func drmConfig(_ json: Any?) -> (fairplay: FairplayConfig?, widevine: WidevineConfig?) {
        guard let json = json as? [String: Any?] else {
            return (nil, nil)
        }
        return (
            fairplay: json["fairplay"].flatMap(RCTConvert.fairplayConfig),
            widevine: json["widevine"].flatMap(RCTConvert.widevineConfig)
        )
    }

    static func fairplayConfig(_ json: Any?) -> FairplayConfig? {
        guard let json = json as? [String: Any?],
              let licenseURLString = json["licenseUrl"] as? String,
              let certificateURLString = json["certificateUrl"] as? String,
              let certificateURL = URL(string: certificateURLString) else {
            return nil
        }
        let fairplayConfig = FairplayConfig(
            license: URL(string: licenseURLString),
            certificateURL: certificateURL
        )
        if let licenseRequestHeaders = json["licenseRequestHeaders"] as? [String: String] {
            fairplayConfig.licenseRequestHeaders = licenseRequestHeaders
        }
        if let certificateRequestHeaders = json["certificateRequestHeaders"] as? [String: String] {
            fairplayConfig.certificateRequestHeaders = certificateRequestHeaders
        }
        return fairplayConfig
    }

    static func widevineConfig(_ json: Any?) -> WidevineConfig? {
        guard let json = json as? [String: Any?],
            let licenseURL = json["licenseUrl"] as? String else {
            return nil
        }
        let widevineConfig = WidevineConfig(license: URL(string: licenseURL))
        if let licenseRequestHeaders = json["httpHeaders"] as? [String: String] {
            widevineConfig.licenseRequestHeaders = licenseRequestHeaders
        }
        return widevineConfig
    }

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

    static func audioTrackJson(_ audioTrack: AudioTrack?) -> [String: Any]? {
        guard let audioTrack else {
            return nil
        }
        var audioTrackDict: [String: Any] = [
            "label": audioTrack.label,
            "isDefault": audioTrack.isDefaultTrack,
            "identifier": audioTrack.identifier,
        ]
        if let url = audioTrack.url {
            audioTrackDict["url"] = url.absoluteString
        }
        if let language = audioTrack.language {
            audioTrackDict["language"] = language
        }
        audioTrackDict["roles"] = audioTrack.characteristics.map { characteristic in
            [
                "schemeIdUri": "urn:hls:characteristic",
                "value": characteristic
            ]
        }
        return audioTrackDict
    }

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

    static func subtitleFormat(_ json: Any?) -> SubtitleFormat? {
        guard let json = json as? String else {
            return nil
        }
        switch json {
        case "cea":
            return .cea
        case "vtt":
            return .webVtt
        case "ttml":
            return .ttml
        case "srt":
            return .srt
        default:
            return nil
        }
    }

    static func subtitleTrackJson(_ subtitleTrack: SubtitleTrack?) -> [String: Any]? {
        guard let subtitleTrack else {
            return nil
        }
        var subtitleTrackDict: [String: Any] = [
            "label": subtitleTrack.label,
            "isDefault": subtitleTrack.isDefaultTrack,
            "identifier": subtitleTrack.identifier,
            "isForced": subtitleTrack.isForced,
        ]
        if let url = subtitleTrack.url {
            subtitleTrackDict["url"] = url.absoluteString
        }
        if let language = subtitleTrack.language {
            subtitleTrackDict["language"] = language
        }
        switch subtitleTrack.format {
        case .cea:
            subtitleTrackDict["format"] = "cea"
        case .webVtt:
            subtitleTrackDict["format"] = "vtt"
        case .ttml:
            subtitleTrackDict["format"] = "ttml"
        case .srt:
            subtitleTrackDict["format"] = "srt"
        default:
            break
        }

        subtitleTrackDict["roles"] = subtitleTrack.characteristics.map { characteristic in
            [
                "schemeIdUri": "urn:hls:characteristic",
                "value": characteristic
            ]
        }
        return subtitleTrackDict
    }

    static func toJson(thumbnailTrack: ThumbnailTrack?) -> [AnyHashable: Any]? {
        guard let thumbnailTrack else {
            return nil
        }

        var thumbnailTrackDict: [String: Any] = [
            "label": thumbnailTrack.label,
            "isDefault": thumbnailTrack.isDefaultTrack,
            "identifier": thumbnailTrack.identifier
        ]
        if let url = thumbnailTrack.url {
            thumbnailTrackDict["url"] = url.absoluteString
        }

        return thumbnailTrackDict
    }

    static func toJson(adItem: AdItem?) -> [String: Any?]? {
        guard let adItem else {
            return nil
        }
        return [
            "position": adItem.position,
            "sources": adItem.sources.compactMap { RCTConvert.toJson(adSource: $0) }
        ]
    }

    static func toJson(adSource: AdSource?) -> [String: Any?]? {
        guard let adSource else {
            return nil
        }
        return [
            "tag": adSource.tag,
            "type": RCTConvert.toJson(adSourceType: adSource.type)
        ]
    }

    static func toJson(adSourceType: AdSourceType?) -> String? {
        guard let adSourceType else {
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

    static func toJson(adConfig: AdConfig?) -> [String: Any?]? {
        guard let adConfig else {
            return nil
        }
        return ["replaceContentDuration": adConfig.replaceContentDuration]
    }

    static func toJson(adQuartile: AdQuartile?) -> String? {
        guard let adQuartile else {
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

    static func toJson(adBreak: AdBreak?) -> [String: Any?]? {
        guard let adBreak else {
            return nil
        }
        return [
            "ads": adBreak.ads.compactMap { RCTConvert.toJson(ad: $0) },
            "id": adBreak.identifier,
            "scheduleTime": adBreak.scheduleTime
        ]
    }

    static func toJson(ad: Ad?) -> [String: Any?]? {
        guard let ad else {
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

    static func toJson(adData: AdData?) -> [String: Any?]? {
        guard let adData else {
            return nil
        }
        return [
            "bitrate": adData.bitrate,
            "maxBitrate": adData.maxBitrate,
            "mimeType": adData.mimeType,
            "minBitrate": adData.minBitrate
        ]
    }

    static func analyticsConfig(_ json: Any?) -> AnalyticsConfig? {
        guard
            let json = json as? [String: Any?],
            let key = json["licenseKey"] as? String
        else {
            return nil
        }
        let randomizeUserId = json["randomizeUserId"] as? Bool
        let adTrackingDisabled = json["adTrackingDisabled"] as? Bool

        let config = AnalyticsConfig(
            licenseKey: key,
            randomizeUserId: randomizeUserId ?? false,
            adTrackingDisabled: adTrackingDisabled ?? false
        )
        return config
    }

    static func analyticsDefaultMetadataFromAnalyticsConfig(_ json: Any?) -> DefaultMetadata? {
        guard
            let analyticsConfigJson = json as? [String: Any?],
            let json = analyticsConfigJson["defaultMetadata"] as? [String: Any?]
        else {
            return nil
        }
        let cdnProvider = json["cdnProvider"] as? String
        let customUserId = json["customUserId"] as? String
        let customData = analyticsCustomData(json)

        return DefaultMetadata(
            cdnProvider: cdnProvider,
            customUserId: customUserId,
            customData: customData ?? CustomData()
        )
    }

    static func analyticsCustomData(_ json: Any?) -> CustomData? {
        guard let json = json as? [String: Any?] else {
            return nil
        }
        return CustomData(
            customData1: json["customData1"] as? String,
            customData2: json["customData2"] as? String,
            customData3: json["customData3"] as? String,
            customData4: json["customData4"] as? String,
            customData5: json["customData5"] as? String,
            customData6: json["customData6"] as? String,
            customData7: json["customData7"] as? String,
            customData8: json["customData8"] as? String,
            customData9: json["customData9"] as? String,
            customData10: json["customData10"] as? String,
            customData11: json["customData11"] as? String,
            customData12: json["customData12"] as? String,
            customData13: json["customData13"] as? String,
            customData14: json["customData14"] as? String,
            customData15: json["customData15"] as? String,
            customData16: json["customData16"] as? String,
            customData17: json["customData17"] as? String,
            customData18: json["customData18"] as? String,
            customData19: json["customData19"] as? String,
            customData20: json["customData20"] as? String,
            customData21: json["customData21"] as? String,
            customData22: json["customData22"] as? String,
            customData23: json["customData23"] as? String,
            customData24: json["customData24"] as? String,
            customData25: json["customData25"] as? String,
            customData26: json["customData26"] as? String,
            customData27: json["customData27"] as? String,
            customData28: json["customData28"] as? String,
            customData29: json["customData29"] as? String,
            customData30: json["customData30"] as? String,
            experimentName: json["experimentName"] as? String
        )
    }

    static func toJson(analyticsCustomData: CustomData?) -> [String: Any?]? {
        guard let analyticsCustomData else {
            return nil
        }
        var json: [String: Any?] = [:]
        json["customData1"] = analyticsCustomData.customData1
        json["customData2"] = analyticsCustomData.customData2
        json["customData3"] = analyticsCustomData.customData3
        json["customData4"] = analyticsCustomData.customData4
        json["customData5"] = analyticsCustomData.customData5
        json["customData6"] = analyticsCustomData.customData6
        json["customData7"] = analyticsCustomData.customData7
        json["customData8"] = analyticsCustomData.customData8
        json["customData9"] = analyticsCustomData.customData9
        json["customData10"] = analyticsCustomData.customData10
        json["customData11"] = analyticsCustomData.customData11
        json["customData12"] = analyticsCustomData.customData12
        json["customData13"] = analyticsCustomData.customData13
        json["customData14"] = analyticsCustomData.customData14
        json["customData15"] = analyticsCustomData.customData15
        json["customData16"] = analyticsCustomData.customData16
        json["customData17"] = analyticsCustomData.customData17
        json["customData18"] = analyticsCustomData.customData18
        json["customData19"] = analyticsCustomData.customData19
        json["customData20"] = analyticsCustomData.customData20
        json["customData21"] = analyticsCustomData.customData21
        json["customData22"] = analyticsCustomData.customData22
        json["customData23"] = analyticsCustomData.customData23
        json["customData24"] = analyticsCustomData.customData24
        json["customData25"] = analyticsCustomData.customData25
        json["customData26"] = analyticsCustomData.customData26
        json["customData27"] = analyticsCustomData.customData27
        json["customData28"] = analyticsCustomData.customData28
        json["customData29"] = analyticsCustomData.customData29
        json["customData30"] = analyticsCustomData.customData30
        json["experimentName"] = analyticsCustomData.experimentName
        return json
    }

    static func analyticsSourceMetadata(_ json: Any?) -> SourceMetadata? {
        guard let json = json as? [String: Any?] else {
            return nil
        }

        let customData = analyticsCustomData(json)

        return SourceMetadata(
            videoId: json["videoId"] as? String,
            title: json["title"] as? String,
            path: json["path"] as? String,
            isLive: json["isLive"] as? Bool,
            cdnProvider: json["cdnProvider"] as? String,
            customData: customData ?? CustomData()
        )
    }

    static func toJson(videoQuality: VideoQuality?) -> [String: Any]? {
        guard let videoQuality else {
            return nil
        }
        var videoQualityDict: [String: Any] = [
            "id": videoQuality.identifier,
            "label": videoQuality.label,
            "height": videoQuality.height,
            "width": videoQuality.width,
            "bitrate": videoQuality.bitrate,
        ]
        if let codec = videoQuality.codec {
            videoQualityDict["codec"] = codec
        }

        return videoQualityDict
    }

    static func userInterfaceType(_ json: Any?) -> UserInterfaceType? {
        guard let json = json as? String else {
            return .none
        }
        switch json {
#if os(iOS)
        case "Bitmovin":
            return .bitmovin
#endif
        case "System":
            return .system
        case "Subtitle":
            return .subtitle
        default:
            return nil
        }
    }

#if os(iOS)
    static func toJson(offlineState: OfflineState?) -> String {
        var notDownloaded = "NotDownloaded"
        guard let offlineState else {
            return notDownloaded
        }

        switch offlineState {
        case .downloading:
            return "Downloading"
        case .downloaded:
            return "Downloaded"
        case .suspended:
            return "Suspended"
        default:
            return notDownloaded
        }
    }

    static func toJson(offlineTrack: OfflineTextTrack) -> [String: Any?] {
        [
            "id": offlineTrack.label,
            "language": offlineTrack.language,
        ]
    }

    static func toJson(offlineTrack: OfflineAudioTrack) -> [String: Any?] {
        [
            "id": offlineTrack.label,
            "language": offlineTrack.language,
        ]
    }

    static func toJson(offlineTracks: OfflineTrackSelection?) -> [String: Any]? {
        guard let offlineTracks else {
            return nil
        }

        return [
            "textOptions": offlineTracks.textTracks.compactMap { RCTConvert.toJson(offlineTrack: $0) },
            "audioOptions": offlineTracks.audioTracks.compactMap { RCTConvert.toJson(offlineTrack: $0) }
        ]
    }
#endif

    static func adaptationConfig(_ json: Any?) -> AdaptationConfig? {
        guard let json = json as? [String: Any?] else {
            return nil
        }
        let adaptationConfig = AdaptationConfig()
        if let maxSelectableBitrate = json["maxSelectableBitrate"] as? NSNumber {
            adaptationConfig.maxSelectableBitrate = maxSelectableBitrate.uintValue
        }

        return adaptationConfig
    }

    static func toJson(thumbnail: Thumbnail?) -> [String: Any]? {
        guard let thumbnail else {
            return nil
        }

        return [
            "start": thumbnail.start,
            "end": thumbnail.end,
            "text": thumbnail.text,
            "url": thumbnail.url.absoluteString,
            "x": thumbnail.x,
            "y": thumbnail.y,
            "width": thumbnail.width,
            "height": thumbnail.height,
        ]
    }

    static func remoteControlConfig(_ json: Any?) -> RemoteControlConfig? {
        guard let json = json as? [String: Any?] else {
            return nil
        }
        let remoteControlConfig = RemoteControlConfig()
        if let receiverStylesheetUrl = RCTConvert.nsurl(json["receiverStylesheetUrl"]) {
            remoteControlConfig.receiverStylesheetUrl = receiverStylesheetUrl
        }
        if let customReceiverConfig = json["customReceiverConfig"] as? [String: String] {
            remoteControlConfig.customReceiverConfig = customReceiverConfig
        }
        if let isCastEnabled = json["isCastEnabled"] as? Bool {
            remoteControlConfig.isCastEnabled = isCastEnabled
        }
        if let sendManifestRequestsWithCredentials = json["sendManifestRequestsWithCredentials"] as? Bool {
            remoteControlConfig.sendManifestRequestsWithCredentials = sendManifestRequestsWithCredentials
        }
        if let sendSegmentRequestsWithCredentials = json["sendSegmentRequestsWithCredentials"] as? Bool {
            remoteControlConfig.sendSegmentRequestsWithCredentials = sendSegmentRequestsWithCredentials
        }
        if let sendDrmLicenseRequestsWithCredentials = json["sendDrmLicenseRequestsWithCredentials"] as? Bool {
            remoteControlConfig.sendDrmLicenseRequestsWithCredentials = sendDrmLicenseRequestsWithCredentials
        }
        return remoteControlConfig
    }

#if os(iOS)
    static func castManagerOptions(_ json: Any?) -> BitmovinCastManagerOptions? {
        guard let json = json as? [String: Any?] else {
            return nil
        }

        let options = BitmovinCastManagerOptions()
        options.applicationId = json["applicationId"] as? String
        options.messageNamespace = json["messageNamespace"] as? String
        return options
    }

    static func toJson(castPayload: CastPayload) -> [String: Any?] {
        [
            "currentTime": castPayload.currentTime,
            "deviceName": castPayload.deviceName,
            "type": castPayload.type,
        ]
    }

    static func sourceRemoteControlConfig(_ json: Any?) -> SourceRemoteControlConfig? {
        guard let json = json as? [String: Any?],
              let castSourceConfigJson = json["castSourceConfig"] as? [String: Any?] else {
            return nil
        }

        return SourceRemoteControlConfig(
            castSourceConfig: RCTConvert.sourceConfig(
                castSourceConfigJson,
                drmConfig: castSourceConfigJson["drmConfig"].flatMap(RCTConvert.drmConfig)?.widevine
            )
        )
    }
#endif

    static func pictureInPictureConfig(_ json: Any?) -> PictureInPictureConfig? {
        guard let json = json as? [String: Any?] else {
            return nil
        }

        let pictureInPictureConfig = PictureInPictureConfig()
        if let isEnabled = json["isEnabled"] as? Bool {
            pictureInPictureConfig.isEnabled = isEnabled
        }
#if os(iOS)
        if #available(iOS 14.2, *),
           let shouldEnterOnBackground = json["shouldEnterOnBackground"] as? Bool {
            pictureInPictureConfig.shouldEnterOnBackground = shouldEnterOnBackground
        }
        if let pictureInPictureActions = pictureInPictureActions(json["pictureInPictureActions"]) {
            pictureInPictureConfig.showSkipControls = pictureInPictureActions.contains(RNPictureInPictureAction.seek)
        }
#endif
        return pictureInPictureConfig
    }

    static func pictureInPictureActions(_ json: Any?) -> [RNPictureInPictureAction]? {
        guard let array = json as? [String] else {
            return nil
        }

        return array.compactMap { item in
            switch item {
            case "TogglePlayback":
                return .togglePlayback
            case "Seek":
                return .seek
            default:
                return nil
            }
        }
    }

    static func rnPlayerViewConfig(_ json: Any?) -> RNPlayerViewConfig? {
        guard let json = json as? [String: Any?] else {
            return nil
        }

        return RNPlayerViewConfig(
            uiConfig: json["uiConfig"].flatMap(rnUiConfig),
            pictureInPictureConfig: json["pictureInPictureConfig"].flatMap(pictureInPictureConfig),
            hideFirstFrame: json["hideFirstFrame"] as? Bool
        )
    }

    static func rnUiConfig(_ json: Any?) -> RNUiConfig? {
        guard let json = json as? [String: Any?] else {
            return nil
        }
        let variant = json["variant"] as? [String: Any?]
        let uiManagerFactoryFunction = variant?["uiManagerFactoryFunction"] as? String
        let defaultUiManagerFactoryFunction = "bitmovin.playerui.UIFactory.buildDefaultSmallScreenUI"

        return RNUiConfig(
            playbackSpeedSelectionEnabled: json["playbackSpeedSelectionEnabled"] as? Bool ?? true,
            uiManagerFactoryFunction: uiManagerFactoryFunction ?? defaultUiManagerFactoryFunction
        )
    }

    static func bufferType(_ json: String) -> BufferType? {
        switch json {
        case "forwardDuration":
            return .forwardDuration
        case "backwardDuration":
            return .backwardDuration
        default:
            return nil
        }
    }

    static func toJson(bufferType: BufferType) -> String {
        switch bufferType {
        case .forwardDuration:
            return "forwardDuration"
        case .backwardDuration:
            return "backwardDuration"
        }
    }

    static func toJson(bufferLevel: BufferLevel, mediaType: String) -> [String: Any] {
        [
            "level": bufferLevel.level,
            "targetLevel": bufferLevel.targetLevel,
            "media": mediaType,
            "type": toJson(bufferType: bufferLevel.type)
        ]
    }

    static func toJson(bufferLevels: RNBufferLevels) -> [String: Any] {
        [
            "audio": toJson(bufferLevel: bufferLevels.audio, mediaType: "audio"),
            "video": toJson(bufferLevel: bufferLevels.video, mediaType: "video"),
        ]
    }

    static func toJson(httpRequestType: HttpRequestType) -> String {
        httpRequestType.rawValue
    }

    static func toJson(data: Data?) -> String? {
        data?.base64EncodedString()
    }

    static func toJson(httpRequest: HttpRequest) -> [String: Any] {
        [
            "body": toJson(data: httpRequest.body),
            "headers": httpRequest.headers,
            "method": httpRequest.method,
            "url": httpRequest.url.absoluteString
        ]
    }

    static func toJson(httpResponse: HttpResponse) -> [String: Any] {
        [
            "request": toJson(httpRequest: httpResponse.request),
            "url": httpResponse.url.absoluteString,
            "status": httpResponse.status,
            "headers": httpResponse.headers,
            "body": toJson(data: httpResponse.body)
        ]
    }

    static func mediaControlConfig(_ json: Any?) -> NowPlayingConfig? {
        let nowPlayingConfig = NowPlayingConfig()
        guard let json = json as? [String: Any?] else {
            nowPlayingConfig.isNowPlayingInfoEnabled = true
            return nowPlayingConfig
        }
        if let isEnabled = json["isEnabled"] as? Bool {
            nowPlayingConfig.isNowPlayingInfoEnabled = isEnabled
        }
        return nowPlayingConfig
    }
}
/**
 * React native specific PlayerViewConfig.
 */
internal struct RNPlayerViewConfig {
    /**
     * The react native specific ui configuration.
     */
    let uiConfig: RNUiConfig?

    /**
     * Picture in picture config
     */
    let pictureInPictureConfig: PictureInPictureConfig?

    /**
     * PlayerView config considering all properties
     */
    var playerViewConfig: PlayerViewConfig {
        let config = PlayerViewConfig()
        if let pictureInPictureConfig {
            config.pictureInPictureConfig = pictureInPictureConfig
        }
        return config
    }

    /**
     * When set to `true` the first frame of the main content will not be rendered before playback starts.
     * Default is `false`.
     *
     * To reliably hide the first frame before a pre-roll ad, please ensure that you are using the
     * `AdvertisingConfig` to schedule ads and not the `scheduleAd` API call.
     */
    var hideFirstFrame: Bool?
}

/**
 * React native specific UiConfig.
 */
internal struct RNUiConfig {
    let playbackSpeedSelectionEnabled: Bool
    let uiManagerFactoryFunction: String
}

/**
 * Representation of the React Native API `BufferLevels` object.
 * This is necessary as we need a unified representation of the different APIs from both Android and iOS.
 * - Parameter audio: `BufferLevel` for `MediaType.Audio`.
 * - Parameter video: `BufferLevel` for `MediaType.Video`.
 */
internal struct RNBufferLevels {
    let audio: BufferLevel
    let video: BufferLevel
}

internal enum RNPictureInPictureAction {
    case togglePlayback
    case seek
}
