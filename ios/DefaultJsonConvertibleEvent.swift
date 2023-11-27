import BitmovinPlayer

/// Used when the event has no additional data
internal protocol DefaultJsonConvertibleEvent: JsonConvertible {}
internal extension DefaultJsonConvertibleEvent where Self: Event {
    func toJSON() -> [AnyHashable: Any] {
        toEventJSON { [:] }
    }
}
