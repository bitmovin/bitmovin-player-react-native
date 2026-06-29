// swiftlint:disable file_length

import BitmovinPlayer

extension Source {
    func toJSON() -> [AnyHashable: Any] {
        var json: [AnyHashable: Any] = [
            "duration": duration,
            "isActive": isActive,
            "loadingState": loadingState.rawValue,
            "isAttachedToPlayer": isAttachedToPlayer
        ]
        if let metadata {
            json["metadata"] = metadata
        }
        return json
    }
}

extension NSError: JsonConvertible {
    func toJSON() -> [AnyHashable: Any] {
        [
            "code": code,
            "domain": domain,
            "description": description,
            "localizedDescription": localizedDescription
        ]
    }
}

extension DeficiencyData: JsonConvertible {
    func toJSON() -> [AnyHashable: Any] {
        var json: [AnyHashable: Any] = [
            "code": code,
            "message": message,
            "underlyingError": underlyingError.toJSON()
        ]
        if let response {
            json["httpResponse"] = RCTConvert.toJson(httpResponse: response)
        }
        return json
    }
}

extension Event where Self: JsonConvertible {
    func toEventJSON(_ eventPayloadBuilder: () -> [AnyHashable: Any]) -> [AnyHashable: Any] {
        var json: [AnyHashable: Any] = [
            "name": name,
            "timestamp": timestamp,
        ]
        json.merge(eventPayloadBuilder()) { _, new in new }
        return json
    }
}

extension SeekEvent: JsonConvertible {
    func toJSON() -> [AnyHashable: Any] {
        toEventJSON {
            [
                "from": [
                    "time": from.time,
                    "source": from.source.toJSON()
                ],
                "to": [
                    "time": to.time,
                    "source": to.source.toJSON()
                ]
            ]
        }
    }
}

extension TimeShiftEvent: JsonConvertible {
    func toJSON() -> [AnyHashable: Any] {
        toEventJSON {
            [
                "position": position,
                "targetPosition": target
            ]
        }
    }
}

extension TimeChangedEvent: JsonConvertible {
    func toJSON() -> [AnyHashable: Any] {
        toEventJSON {
            ["currentTime": currentTime]
        }
    }
}

private protocol ErrorEventType: Event, JsonConvertible {
    associatedtype Code: RawRepresentable where Code.RawValue == Int
    var code: Code { get }
    var data: DeficiencyData? { get }
    var message: String { get }
}

extension ErrorEventType {
    func toJSON() -> [AnyHashable: Any] {
        toEventJSON {
            var json: [AnyHashable: Any] = [
                "code": code.rawValue,
                "message": message
            ]
            if let data {
                json["data"] = data.toJSON()
            }
            return json
        }
    }
}

extension PlayerErrorEvent: ErrorEventType {
    typealias Code = PlayerError.Code
}

extension PlayerWarningEvent: ErrorEventType {
    typealias Code = PlayerWarning.Code
}

extension SourceErrorEvent: ErrorEventType {
    typealias Code = SourceError.Code
}

extension SourceWarningEvent: ErrorEventType {
    typealias Code = SourceWarning.Code
}

private protocol SourceEventType: Event, JsonConvertible {
    var source: Source { get }
}

extension SourceEventType {
    func toJSON() -> [AnyHashable: Any] {
        toEventJSON {
            ["source": source.toJSON()]
        }
    }
}

extension SourceLoadEvent: SourceEventType {}
extension SourceLoadedEvent: SourceEventType {}
extension SourceUnloadedEvent: SourceEventType {}

private protocol TimedEventType: Event, JsonConvertible {
    var time: TimeInterval { get }
}

extension TimedEventType {
    func toJSON() -> [AnyHashable: Any] {
        toEventJSON {
            ["time": time]
        }
    }
}

extension PlayEvent: TimedEventType {}
extension PausedEvent: TimedEventType {}
extension PlayingEvent: TimedEventType {}

extension AudioAddedEvent: JsonConvertible {
    func toJSON() -> [AnyHashable: Any] {
        toEventJSON {
            [
                "audioTrack": RCTConvert.audioTrackJson(audioTrack),
                "time": time
            ]
        }
    }
}

extension AudioRemovedEvent: JsonConvertible {
    func toJSON() -> [AnyHashable: Any] {
        toEventJSON {
            [
                "audioTrack": RCTConvert.audioTrackJson(audioTrack),
                "time": time
            ]
        }
    }
}

extension AudioChangedEvent: JsonConvertible {
    func toJSON() -> [AnyHashable: Any] {
        toEventJSON {
            [
                "oldAudioTrack": RCTConvert.audioTrackJson(audioTrackOld),
                "newAudioTrack": RCTConvert.audioTrackJson(audioTrackNew)
            ]
        }
    }
}

extension SubtitleAddedEvent: JsonConvertible {
    func toJSON() -> [AnyHashable: Any] {
        toEventJSON {
            [
                "subtitleTrack": RCTConvert.subtitleTrackJson(subtitleTrack)
            ]
        }
    }
}

extension SubtitleRemovedEvent: JsonConvertible {
    func toJSON() -> [AnyHashable: Any] {
        toEventJSON {
            [
                "subtitleTrack": RCTConvert.subtitleTrackJson(subtitleTrack)
            ]
        }
    }
}

extension SubtitleChangedEvent: JsonConvertible {
    func toJSON() -> [AnyHashable: Any] {
        toEventJSON {
            [
                "oldSubtitleTrack": RCTConvert.subtitleTrackJson(subtitleTrackOld),
                "newSubtitleTrack": RCTConvert.subtitleTrackJson(subtitleTrackNew)
            ]
        }
    }
}

extension AdBreakFinishedEvent: JsonConvertible {
    func toJSON() -> [AnyHashable: Any] {
        toEventJSON {
            [
                "adBreak": RCTConvert.toJson(adBreak: adBreak)
            ]
        }
    }
}

extension AdBreakStartedEvent: JsonConvertible {
    func toJSON() -> [AnyHashable: Any] {
        toEventJSON {
            [
                "adBreak": RCTConvert.toJson(adBreak: adBreak)
            ]
        }
    }
}

extension AdClickedEvent: JsonConvertible {
    func toJSON() -> [AnyHashable: Any] {
        toEventJSON {
            [
                "clickThroughUrl": clickThroughUrl
            ]
        }
    }
}

extension AdErrorEvent: JsonConvertible {
    func toJSON() -> [AnyHashable: Any] {
        toEventJSON {
            [
                "adConfig": RCTConvert.toJson(adConfig: adConfig),
                "adItem": RCTConvert.toJson(adItem: adItem),
                "code": code,
                "message": message
            ]
        }
    }
}

extension AdFinishedEvent: JsonConvertible {
    func toJSON() -> [AnyHashable: Any] {
        toEventJSON {
            [
                "ad": RCTConvert.toJson(ad: ad)
            ]
        }
    }
}

extension AdManifestLoadEvent: JsonConvertible {
    func toJSON() -> [AnyHashable: Any] {
        toEventJSON {
            [
                "adBreak": RCTConvert.toJson(adBreak: adBreak),
                "adConfig": RCTConvert.toJson(adConfig: adConfig)
            ]
        }
    }
}

extension AdManifestLoadedEvent: JsonConvertible {
    func toJSON() -> [AnyHashable: Any] {
        toEventJSON {
            [
                "adBreak": RCTConvert.toJson(adBreak: adBreak),
                "adConfig": RCTConvert.toJson(adConfig: adConfig),
                "downloadTime": downloadTime
            ]
        }
    }
}

extension AdQuartileEvent: JsonConvertible {
    func toJSON() -> [AnyHashable: Any] {
        toEventJSON {
            [
                "quartile": RCTConvert.toJson(adQuartile: adQuartile)
            ]
        }
    }
}

extension AdScheduledEvent: JsonConvertible {
    func toJSON() -> [AnyHashable: Any] {
        toEventJSON {
            [
                "numberOfAds": numberOfAds
            ]
        }
    }
}

extension AdSkippedEvent: JsonConvertible {
    func toJSON() -> [AnyHashable: Any] {
        toEventJSON {
            [
                "ad": RCTConvert.toJson(ad: ad)
            ]
        }
    }
}

extension AdStartedEvent: JsonConvertible {
    func toJSON() -> [AnyHashable: Any] {
        toEventJSON {
            [
                "ad": RCTConvert.toJson(ad: ad),
                "clickThroughUrl": clickThroughUrl?.absoluteString,
                "clientType": RCTConvert.toJson(adSourceType: clientType),
                "duration": duration,
                "indexInQueue": indexInQueue,
                "position": position,
                "skipOffset": skipOffset,
                "timeOffset": timeOffset
            ]
        }
    }
}

extension VideoDownloadQualityChangedEvent: JsonConvertible {
    func toJSON() -> [AnyHashable: Any] {
        toEventJSON {
            [
                "newVideoQuality": RCTConvert.toJson(videoQuality: videoQualityNew),
                "oldVideoQuality": RCTConvert.toJson(videoQuality: videoQualityOld),
            ]
        }
    }
}

extension VideoPlaybackQualityChangedEvent: JsonConvertible {
    func toJSON() -> [AnyHashable: Any] {
        toEventJSON {
            [
                "newVideoQuality": RCTConvert.toJson(videoQuality: videoQualityNew),
                "oldVideoQuality": RCTConvert.toJson(videoQuality: videoQualityOld),
            ]
        }
    }
}

extension CastStartedEvent: JsonConvertible {
    func toJSON() -> [AnyHashable: Any] {
        toEventJSON {
            [
                "deviceName": deviceName
            ]
        }
    }
}

#if os(iOS)
extension CastWaitingForDeviceEvent: JsonConvertible {
    func toJSON() -> [AnyHashable: Any] {
        toEventJSON {
            [
                "castPayload": RCTConvert.toJson(castPayload: castPayload)
            ]
        }
    }
}

#endif

extension DownloadFinishedEvent: JsonConvertible {
    func toJSON() -> [AnyHashable: Any] {
        toEventJSON {
            var json: [AnyHashable: Any] = [
                "downloadTime": downloadTime,
                "requestType": requestType.rawValue,
                "httpStatus": httpStatus,
                "isSuccess": successful,
                "size": size,
                "url": url.absoluteString
            ]
            if let lastRedirectLocation {
                json["lastRedirectLocation"] = lastRedirectLocation.absoluteString
            }
            return json
        }
    }
}

extension PlaybackSpeedChangedEvent: JsonConvertible {
    func toJSON() -> [AnyHashable: Any] {
        toEventJSON {
            [
                "from": from,
                "to": to,
            ]
        }
    }
}

private extension VttPosition {
    var jsonValue: Any? {
        switch type {
        case .value:
            return value
        default:
            return nil
        }
    }
}

private extension VttVertical {
    var writingModeJSONValue: String? {
        switch self {
        case .leftToRight:
            return "vertical-lr"
        case .rightToLeft:
            return "vertical-rl"
        default:
            return nil
        }
    }
}

private extension VttLineAlign {
    var jsonValue: String? {
        switch self {
        case .center:
            return "center"
        case .end:
            return "end"
        default:
            return nil
        }
    }
}

private extension VttAlign {
    var jsonValue: String? {
        switch self {
        case .start:
            return "start"
        case .center:
            return "center"
        case .end:
            return "end"
        case .left:
            return "left"
        case .right:
            return "right"
        default:
            return nil
        }
    }
}

private extension VttPositionAlign {
    var jsonValue: String? {
        switch self {
        case .lineLeft:
            return "line-left"
        case .center:
            return "center"
        case .lineRight:
            return "line-right"
        default:
            return nil
        }
    }
}

private extension VttProperties {
    var layoutJSON: [AnyHashable: Any]? {
        var json: [AnyHashable: Any] = [:]
        if let line = lineJSON {
            json["line"] = line
        }
        if let lineAlign = lineAlign.jsonValue {
            json["lineAlign"] = lineAlign
        }
        if size != 100 {
            json["size"] = size
        }
        if let textAlign = align.jsonValue {
            json["textAlign"] = textAlign
        }
        if let position = position.jsonValue {
            json["position"] = position
        }
        if let positionAlign = positionAlign.jsonValue {
            json["positionAlign"] = positionAlign
        }
        if let writingMode = vertical.writingModeJSONValue {
            json["writingMode"] = writingMode
        }
        return json.isEmpty ? nil : json
    }

    private var lineJSON: [AnyHashable: Any]? {
        switch line.type {
        case .value:
            [
                "value": line.value,
                "unit": snapToLines ? "line" : "percent",
            ]
        default:
            nil
        }
    }
}

private func layoutJSON(from vtt: VttProperties?) -> [AnyHashable: Any]? {
    guard let vtt else {
        return nil
    }

    return vtt.layoutJSON
}

private func regionJSON(
    region: String?,
    regionStyle: String?
) -> [AnyHashable: Any]? {
    var json: [AnyHashable: Any] = [:]
    if let region = region.nonEmptyOrNil {
        json["id"] = region
    }
    if let regionStyle = regionStyle.nonEmptyOrNil {
        json["style"] = regionStyle
    }
    return json.isEmpty ? nil : json
}

private extension CuePosition {
    var json: [AnyHashable: Any] {
        [
            "rowIndex": row,
            "columnIndex": column,
            "rows": 15,
            "columns": 32,
        ]
    }
}

private extension String? {
    var nonEmptyOrNil: String? {
        self?.isEmpty == false ? self : nil
    }
}

extension CueEnterEvent: JsonConvertible {
    func toJSON() -> [AnyHashable: Any] {
        toEventJSON {
            var json: [AnyHashable: Any] = [
                "start": startTime,
                "end": endTime,
            ]
            if let text {
                json["text"] = text
            }
            if let imagePngData = image?.pngData() {
                json["image"] = "data:image/png;base64,\(imagePngData.base64EncodedString())"
            }
            if let html = html.nonEmptyOrNil {
                json["html"] = html
            }
            if let layout = layoutJSON(from: vtt) {
                json["layout"] = layout
            }
            if let region = regionJSON(region: region, regionStyle: regionStyle) {
                json["region"] = region
            }
            if let position {
                json["cea608Position"] = position.json
            }
            return json
        }
    }
}

extension CueExitEvent: JsonConvertible {
    func toJSON() -> [AnyHashable: Any] {
        toEventJSON {
            var json: [AnyHashable: Any] = [
                "start": startTime,
                "end": endTime,
            ]
            if let text {
                json["text"] = text
            }
            if let imagePngData = image?.pngData() {
                json["image"] = "data:image/png;base64,\(imagePngData.base64EncodedString())"
            }
            if let html = html.nonEmptyOrNil {
                json["html"] = html
            }
            if let layout = layoutJSON(from: vtt) {
                json["layout"] = layout
            }
            if let region = regionJSON(region: region, regionStyle: regionStyle) {
                json["region"] = region
            }
            if let position {
                json["cea608Position"] = position.json
            }
            return json
        }
    }
}

extension MetadataEvent: JsonConvertible {
    func toJSON() -> [AnyHashable: Any] {
        toEventJSON {
            [
                "metadataType": RCTConvert.metadataTypeString(metadataType),
                "metadata": RCTConvert.toJson(metadata: metadata, type: metadataType)
            ]
        }
    }
}

extension MetadataParsedEvent: JsonConvertible {
    func toJSON() -> [AnyHashable: Any] {
        toEventJSON {
            [
                "metadataType": RCTConvert.metadataTypeString(metadataType),
                "metadata": RCTConvert.toJson(metadata: metadata, type: metadataType)
            ]
        }
    }
}

extension FairplayLicenseAcquiredEvent: JsonConvertible {
    func toJSON() -> [AnyHashable: Any] {
        toEventJSON {
            [
                "contentKeyRequest": [
                    "skdUri": contentKeyRequest.skdUri
                ]
            ]
        }
    }
}

extension PlayerActiveEvent: DefaultJsonConvertibleEvent {}
extension PlayerInactiveEvent: DefaultJsonConvertibleEvent {}
extension DestroyEvent: DefaultJsonConvertibleEvent {}
extension MutedEvent: DefaultJsonConvertibleEvent {}
extension UnmutedEvent: DefaultJsonConvertibleEvent {}
extension ReadyEvent: DefaultJsonConvertibleEvent {}
extension PlaybackFinishedEvent: DefaultJsonConvertibleEvent {}
extension SeekedEvent: DefaultJsonConvertibleEvent {}
extension TimeShiftedEvent: DefaultJsonConvertibleEvent {}
extension StallStartedEvent: DefaultJsonConvertibleEvent {}
extension StallEndedEvent: DefaultJsonConvertibleEvent {}
extension CastAvailableEvent: DefaultJsonConvertibleEvent {}
extension CastPausedEvent: DefaultJsonConvertibleEvent {}
extension CastPlaybackFinishedEvent: DefaultJsonConvertibleEvent {}
extension CastPlayingEvent: DefaultJsonConvertibleEvent {}
extension CastStartEvent: DefaultJsonConvertibleEvent {}
extension CastStoppedEvent: DefaultJsonConvertibleEvent {}
extension CastTimeUpdatedEvent: DefaultJsonConvertibleEvent {}
extension PictureInPictureEnterEvent: DefaultJsonConvertibleEvent {}
extension PictureInPictureEnteredEvent: DefaultJsonConvertibleEvent {}
extension PictureInPictureExitEvent: DefaultJsonConvertibleEvent {}
extension PictureInPictureExitedEvent: DefaultJsonConvertibleEvent {}
extension FullscreenEnterEvent: DefaultJsonConvertibleEvent {}
extension FullscreenExitEvent: DefaultJsonConvertibleEvent {}
extension FullscreenEnabledEvent: DefaultJsonConvertibleEvent {}
extension FullscreenDisabledEvent: DefaultJsonConvertibleEvent {}
