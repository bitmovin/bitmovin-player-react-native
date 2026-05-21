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

private func vttLineJSONValue(_ line: VttLine) -> Any {
    switch line.type {
    case .value:
        return line.value
    default:
        return "auto"
    }
}

private func vttPositionJSONValue(_ position: VttPosition) -> Any {
    switch position.type {
    case .value:
        return position.value
    default:
        return "auto"
    }
}

private func vttVerticalJSONValue(_ vertical: VttVertical) -> String {
    switch vertical {
    case .leftToRight:
        return "lr"
    case .rightToLeft:
        return "rl"
    default:
        return ""
    }
}

private func vttLineAlignJSONValue(_ lineAlign: VttLineAlign) -> String {
    switch lineAlign {
    case .center:
        return "center"
    case .end:
        return "end"
    default:
        return "start"
    }
}

private func vttAlignJSONValue(_ align: VttAlign) -> String {
    switch align {
    case .center:
        return "center"
    case .end:
        return "end"
    case .left:
        return "left"
    case .right:
        return "right"
    default:
        return "start"
    }
}

private func vttPositionAlignJSONValue(_ positionAlign: VttPositionAlign) -> String {
    switch positionAlign {
    case .lineLeft:
        return "line-left"
    case .center:
        return "center"
    case .lineRight:
        return "line-right"
    default:
        return "auto"
    }
}

private func vttPropertiesJSON(_ vtt: VttProperties?) -> [AnyHashable: Any]? {
    guard let vtt else {
        return nil
    }

    return [
        "vertical": vttVerticalJSONValue(vtt.vertical),
        "line": vttLineJSONValue(vtt.line),
        "lineAlign": vttLineAlignJSONValue(vtt.lineAlign),
        "snapToLines": vtt.snapToLines,
        "size": vtt.size,
        "align": vttAlignJSONValue(vtt.align),
        "position": vttPositionJSONValue(vtt.position),
        "positionAlign": vttPositionAlignJSONValue(vtt.positionAlign),
    ]
}

private func cea608PositionJSON(_ position: CuePosition?) -> [AnyHashable: Any]? {
    guard let position else { return nil }
    return ["row": position.row, "column": position.column]
}

extension CueEnterEvent: JsonConvertible {
    func toJSON() -> [AnyHashable: Any] {
        toEventJSON {
            var json: [AnyHashable: Any] = [
                "start": startTime,
                "end": endTime,
                "text": text,
            ]
            if let imagePngData = image?.pngData() {
                json["image"] = "data:image/png;base64,\(imagePngData.base64EncodedString())"
            }
            if let html {
                json["html"] = html
            }
            if let region {
                json["region"] = region
            }
            if let vttJSON = vttPropertiesJSON(vtt) {
                json["vtt"] = vttJSON
            }
            if let posJSON = cea608PositionJSON(position) {
                json["cea608Position"] = posJSON
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
                "text": text,
            ]
            if let imagePngData = image?.pngData() {
                json["image"] = "data:image/png;base64,\(imagePngData.base64EncodedString())"
            }
            if let html {
                json["html"] = html
            }
            if let region {
                json["region"] = region
            }
            if let vttJSON = vttPropertiesJSON(vtt) {
                json["vtt"] = vttJSON
            }
            if let posJSON = cea608PositionJSON(position) {
                json["cea608Position"] = posJSON
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
