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
        var json: [AnyHashable: Any] = ["code": code, "message": message]
        if let underlyingError {
            json["underlyingError"] = underlyingError.toJSON()
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
    associatedtype Code
    var code: Code { get }
    var data: DeficiencyData? { get }
    var message: String { get }
}

extension ErrorEventType {
    func toJSON() -> [AnyHashable: Any] {
        toEventJSON {
            var json: [AnyHashable: Any] = [
                "code": code,
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

extension PlayerActiveEvent: DefaultJsonConvertibleEvent {}
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
