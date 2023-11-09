import BitmovinPlayer

extension Source {
    func toJSON() -> [AnyHashable: Any] {
        var json: [AnyHashable: Any] = [
            "duration": duration,
            "isActive": isActive,
            "loadingState": loadingState,
            "isAttachedToPlayer": isAttachedToPlayer
        ]
        if let metadata {
            json["metadata"] = metadata
        }
        return json
    }
}

extension SeekEvent {
    func toJSON() -> [AnyHashable: Any] {
        [
            "name": name,
            "timestamp": timestamp,
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

extension TimeShiftEvent {
    func toJSON() -> [AnyHashable: Any] {
        [
            "name": name,
            "timestamp": timestamp,
            "position": position,
            "targetPosition": target
        ]
    }
}

extension TimeChangedEvent {
    func toJSON() -> [AnyHashable: Any] {
        ["name": name, "timestamp": timestamp, "currentTime": currentTime]
    }
}

extension Event {
    func toJSON() -> [AnyHashable: Any] {
        ["name": name, "timestamp": timestamp]
    }
}

extension NSError {
    func toJSON() -> [AnyHashable: Any] {
        [
            "code": code,
            "domain": domain,
            "description": description,
            "localizedDescription": localizedDescription
        ]
    }
}

extension DeficiencyData {
    func toJSON() -> [AnyHashable: Any] {
        var json: [AnyHashable: Any] = ["code": code, "message": message]
        if let underlyingError {
            json["underlyingError"] = underlyingError.toJSON()
        }
        return json
    }
}

private protocol ErrorEventType: Event {
    associatedtype Code
    var code: Code { get }
    var data: DeficiencyData? { get }
    var message: String { get }
}

extension ErrorEventType {
    func toJSON() -> [AnyHashable: Any] {
        var json: [AnyHashable: Any] = [
            "name": name,
            "timestamp": timestamp,
            "code": code,
            "message": message
        ]
        if let data {
            json["data"] = data.toJSON()
        }
        return json
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

private protocol SourceEventType: Event {
    var source: Source { get }
}

extension SourceEventType {
    func toJSON() -> [AnyHashable: Any] {
        ["name": name, "timestamp": timestamp, "source": source.toJSON()]
    }
}

extension SourceLoadEvent: SourceEventType {}
extension SourceLoadedEvent: SourceEventType {}
extension SourceUnloadedEvent: SourceEventType {}

private protocol TimedEventType: Event {
    var time: TimeInterval { get }
}

extension TimedEventType {
    func toJSON() -> [AnyHashable: Any] {
        ["name": name, "timestamp": timestamp, "time": time]
    }
}

extension PlayEvent: TimedEventType {}
extension PausedEvent: TimedEventType {}
extension PlayingEvent: TimedEventType {}

extension AudioAddedEvent {
    func toJSON() -> [AnyHashable: Any] {
        [
            "name": name,
            "timestamp": timestamp,
            "audioTrack": RCTConvert.audioTrackJson(audioTrack),
            "time": time
        ]
    }
}

extension AudioRemovedEvent {
    func toJSON() -> [AnyHashable: Any] {
        [
            "name": name,
            "timestamp": timestamp,
            "audioTrack": RCTConvert.audioTrackJson(audioTrack),
            "time": time
        ]
    }
}

extension AudioChangedEvent {
    func toJSON() -> [AnyHashable: Any] {
        [
            "name": name,
            "timestamp": timestamp,
            "oldAudioTrack": RCTConvert.audioTrackJson(audioTrackOld),
            "newAudioTrack": RCTConvert.audioTrackJson(audioTrackNew)
        ]
    }
}

extension SubtitleAddedEvent {
    func toJSON() -> [AnyHashable: Any] {
        [
            "name": name,
            "timestamp": timestamp,
            "subtitleTrack": RCTConvert.subtitleTrackJson(subtitleTrack)
        ]
    }
}

extension SubtitleRemovedEvent {
    func toJSON() -> [AnyHashable: Any] {
        [
            "name": name,
            "timestamp": timestamp,
            "subtitleTrack": RCTConvert.subtitleTrackJson(subtitleTrack)
        ]
    }
}

extension SubtitleChangedEvent {
    func toJSON() -> [AnyHashable: Any] {
        [
            "name": name,
            "timestamp": timestamp,
            "oldSubtitleTrack": RCTConvert.subtitleTrackJson(subtitleTrackOld),
            "newSubtitleTrack": RCTConvert.subtitleTrackJson(subtitleTrackNew)
        ]
    }
}

extension AdBreakFinishedEvent {
    func toJSON() -> [AnyHashable: Any] {
        [
            "name": name,
            "timestamp": timestamp,
            "adBreak": RCTConvert.toJson(adBreak: adBreak)
        ]
    }
}

extension AdBreakStartedEvent {
    func toJSON() -> [AnyHashable: Any] {
        [
            "name": name,
            "timestamp": timestamp,
            "adBreak": RCTConvert.toJson(adBreak: adBreak)
        ]
    }
}

extension AdClickedEvent {
    func toJSON() -> [AnyHashable: Any] {
        [
            "name": name,
            "timestamp": timestamp,
            "clickThroughUrl": clickThroughUrl
        ]
    }
}

extension AdErrorEvent {
    func toJSON() -> [AnyHashable: Any] {
        [
            "name": name,
            "timestamp": timestamp,
            "adConfig": RCTConvert.toJson(adConfig: adConfig),
            "adItem": RCTConvert.toJson(adItem: adItem),
            "code": code,
            "message": message
        ]
    }
}

extension AdFinishedEvent {
    func toJSON() -> [AnyHashable: Any] {
        [
            "name": name,
            "timestamp": timestamp,
            "ad": RCTConvert.toJson(ad: ad)
        ]
    }
}

extension AdManifestLoadEvent {
    func toJSON() -> [AnyHashable: Any] {
        [
            "name": name,
            "timestamp": timestamp,
            "adBreak": RCTConvert.toJson(adBreak: adBreak),
            "adConfig": RCTConvert.toJson(adConfig: adConfig)
        ]
    }
}

extension AdManifestLoadedEvent {
    func toJSON() -> [AnyHashable: Any] {
        [
            "name": name,
            "timestamp": timestamp,
            "adBreak": RCTConvert.toJson(adBreak: adBreak),
            "adConfig": RCTConvert.toJson(adConfig: adConfig),
            "downloadTime": downloadTime
        ]
    }
}

extension AdQuartileEvent {
    func toJSON() -> [AnyHashable: Any] {
        [
            "name": name,
            "timestamp": timestamp,
            "quartile": RCTConvert.toJson(adQuartile: adQuartile)
        ]
    }
}

extension AdScheduledEvent {
    func toJSON() -> [AnyHashable: Any] {
        [
            "name": name,
            "timestamp": timestamp,
            "numberOfAds": numberOfAds
        ]
    }
}

extension AdSkippedEvent {
    func toJSON() -> [AnyHashable: Any] {
        [
            "name": name,
            "timestamp": timestamp,
            "ad": RCTConvert.toJson(ad: ad)
        ]
    }
}

extension AdStartedEvent {
    func toJSON() -> [AnyHashable: Any] {
        [
            "name": name,
            "timestamp": timestamp,
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

extension VideoDownloadQualityChangedEvent {
    func toJSON() -> [AnyHashable: Any] {
        [
            "newVideoQuality": RCTConvert.toJson(videoQuality: videoQualityNew),
            "oldVideoQuality": RCTConvert.toJson(videoQuality: videoQualityOld),
            "name": name,
            "timestamp": timestamp
        ]
    }
}

extension VideoPlaybackQualityChangedEvent {
    func toJSON() -> [AnyHashable: Any] {
        [
            "newVideoQuality": RCTConvert.toJson(videoQuality: videoQualityNew),
            "oldVideoQuality": RCTConvert.toJson(videoQuality: videoQualityOld),
            "name": name,
            "timestamp": timestamp
        ]
    }
}

extension CastStartedEvent {
    func toJSON() -> [AnyHashable: Any] {
        [
            "name": name,
            "timestamp": timestamp,
            "deviceName": deviceName
        ]
    }
}

#if os(iOS)
extension CastWaitingForDeviceEvent {
    func toJSON() -> [AnyHashable: Any] {
        [
            "name": name,
            "timestamp": timestamp,
            "castPayload": RCTConvert.toJson(castPayload: castPayload)
        ]
    }
}
#endif

extension DownloadFinishedEvent {
    func toJSON() -> [AnyHashable: Any] {
        var json: [AnyHashable: Any] = [
            "name": name,
            "timestamp": timestamp,
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

extension PlaybackSpeedChangedEvent {
    func toJSON() -> [AnyHashable: Any] {
        [
            "name": name,
            "timestamp": timestamp,
            "from": from,
            "to": to,
        ]
    }
}
