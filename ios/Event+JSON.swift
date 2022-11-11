import BitmovinPlayer

extension Source {
    func toJSON() -> [AnyHashable: Any] {
        var json: [AnyHashable: Any] = [
            "duration": duration,
            "isActive": isActive,
            "loadingState": loadingState,
            "isAttachedToPlayer": isAttachedToPlayer
        ]
        if let metadata = metadata {
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
        if let underlyingError = underlyingError {
            json["underlyingError"] = underlyingError.toJSON()
        }
        return json
    }
}

protocol ErrorEventType: Event {
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
        if let data = data {
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

protocol SourceEventType: Event {
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

protocol TimedEventType: Event {
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
            "audioTrack": RCTConvert.audioTrackJson(audioTrack)
        ]
    }
}

extension AudioRemovedEvent {
    func toJSON() -> [AnyHashable: Any] {
        [
            "name": name,
            "timestamp": timestamp,
            "audioTrack": RCTConvert.audioTrackJson(audioTrack)
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

extension VideoSizeChangedEvent {
    func toJSON() -> [AnyHashable: Any] {
        [
            "name": name,
            "timestamp": timestamp
        ]
    }
}

extension VideoDownloadQualityChangedEvent {
    func toJSON() -> [AnyHashable: Any] {
        [
            "newVideoQuality": [
                "height": videoQualityNew?.height,
                "width": videoQualityNew?.width,
                "codec": videoQualityNew?.codec,
                "bitrate": videoQualityNew?.bitrate,
            ],
            "oldVideoQuality": [
                "height": videoQualityOld?.height,
                "width": videoQualityOld?.width,
                "codec": videoQualityOld?.codec,
                "bitrate": videoQualityOld?.bitrate,
            ],
            "name": name,
            "timestamp": timestamp
        ]
    }
}

extension DurationChangedEvent {
    func toJSON() -> [AnyHashable: Any] {
        [
            "duration": duration,
            "name": name,
            "timestamp": timestamp
        ]
    }
}

// --- Temp Ad Events --- //

extension AdStartedEvent {
    func toJSON() -> [AnyHashable: Any] {
        [
            "name": name,
            "timestamp": timestamp,
            "clientType": RCTConvert.adSourceTypeJson(clientType),
            "clickThroughUrl": clickThroughUrl,
            "indexInQueue": indexInQueue,
            "duration": duration,
            "timeOffset": timeOffset,
            "position": position,
            "skipOffset": skipOffset,
            "ad": RCTConvert.adJson(ad)

        ]
    }
}

extension AdFinishedEvent {
    func toJSON() -> [AnyHashable: Any] {
        [
            "name": name,
            "timestamp": timestamp,
            "ad": RCTConvert.adJson(ad)
        ]
    }
}

extension AdQuartileEvent {
    func toJSON() -> [AnyHashable: Any] {
        [
            "name": name,
            "timestamp": timestamp,
            "quartile": RCTConvert.adQuartileJson(adQuartile)
        ]
    }
}

extension AdBreakStartedEvent {
    func toJSON() -> [AnyHashable: Any] {
        [
            "name": name,
            "timestamp": timestamp,
            "adBreak": RCTConvert.adBreakJson(adBreak)
        ]
    }
}

extension AdBreakFinishedEvent {
    func toJSON() -> [AnyHashable: Any] {
        [
            "name": name,
            "timestamp": timestamp,
            "adBreak": RCTConvert.adBreakJson(adBreak)
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
            "ad": RCTConvert.adJson(ad)
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
            "code": code,
            "message": message,
            "adConfig": RCTConvert.adConfigJson(adConfig),
            "adItem": RCTConvert.adItemJson(adItem)
        ]
    }
}

extension AdManifestLoadEvent {
    func toJSON() -> [AnyHashable: Any] {
        [
            "name": name,
            "timestamp": timestamp,
            "adBreak": RCTConvert.adBreakJson(adBreak),
            "adConfig": RCTConvert.adConfigJson(adConfig)
        ]
    }
}

extension AdManifestLoadedEvent {
    func toJSON() -> [AnyHashable: Any] {
        [
            "name": name,
            "timestamp": timestamp,
            "adBreak": RCTConvert.adBreakJson(adBreak),
            "adConfig": RCTConvert.adConfigJson(adConfig),
            "downloadTime": downloadTime
        ]
    }
}
