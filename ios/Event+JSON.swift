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

extension CueEvent where Self: Event {
    func toJSON() -> [AnyHashable: Any] {
        // Initial JS event object.
        var json: [AnyHashable: Any] = [
            "name": name,
            "timestamp": timestamp,
            "html": html,
            "text": text,
            "start": startTime,
            "end": endTime
        ]

        // Initial JS cue object.
        var cueJson: [AnyHashable: Any] = [
            "text": text,
            "html": html,
            "start": startTime,
            "end": endTime,
        ]

        // Define CEA-only positioning properties.
        if let position = position {
            cueJson.merge([
                "ceaPosition": [
                    "row": position.row,
                    "column": position.column
                ]
            ]) { $1 }
        }

        // Define VTT positioning properties.
        if let cue = vtt {
            let direction: String = {
                switch cue.vertical {
                case .leftToRight: return "leftToRight"
                case .rightToLeft: return "rightToLeft"
                default: return "horizontal"
                }
            }()
            let lineType: String = {
                switch cue.line.type {
                case .auto: return "auto"
                case .value: return "numeric"
                }
            }()
            let lineAlign: String = {
                switch cue.lineAlign {
                case .start: return "start"
                case .end: return "end"
                case .center: return "center"
                default: return "unset"
                }
            }()
            let vttPositionType: String = {
                switch cue.position.type {
                case .auto: return "auto"
                case .value: return "numeric"
                }
            }()
            let vttPositionAlign: String = {
                switch cue.positionAlign {
                case .lineLeft: return "left"
                case .lineRight: return "right"
                case .center: return "center"
                default: return "unset"
                }
            }()
            let textAlignment: String = {
                switch cue.align {
                case .start: return "start"
                case .end: return "end"
                case .left: return "left"
                case .right: return "right"
                case .center: return "center"
                default: return "unset"
                }
            }()
            cueJson.merge([
                "direction": direction,
                "line": [
                    "type": lineType,
                    "align": lineAlign,
                    "value": cue.line.value
                ],
                "vttPosition": [
                    "type": vttPositionType,
                    "align": vttPositionAlign,
                    "value": cue.position.value
                ],
                "size": cue.size,
                "textAlignment": textAlignment
            ]) { $1 }
        }
        json["cue"] = cueJson
        return json
    }
}
