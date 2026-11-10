import BitmovinPlayer
import ExpoModulesCore
import Foundation

/// SDK listeners hold this adapter weakly; it never owns the SharedObject or its SDK object.
internal final class SharedObjectEvents: NSObject, PlayerListener, SourceListener {
    weak var owner: SharedObject?

    func onEvent(_ event: any Event, player: any Player) {
        if let added = event as? SourceAddedEvent {
            // Also observe SDK-created sources, including offline playback.
            _ = SourceFairplayRequests.attached(to: added.source)
        }
        forward(event)
    }
    func onEvent(_ event: any SourceEvent, source: any Source) { forward(event) }

    private func forward(_ event: any Event) {
        let payload = event.eventPayload()
        guard !payload.isEmpty else { return }
        let name = event.name.hasPrefix("on") ? String(event.name.dropFirst(2)) : event.name
        owner?.emit(event: name.prefix(1).lowercased() + name.dropFirst(), payload: payload)
        owner?.emit(event: "event", payload: payload)
    }
}

extension Event {
    func eventPayload() -> [String: Any] {
        guard let jsonConvertible = self as? JsonConvertible else {
            return [:]
        }
        let anyHashableKeyedPayload = jsonConvertible.toJSON()
        let stringKeyedPayload = anyHashableKeyedPayload.reduce(into: [String: Any]()) { result, pair in
            if let key = pair.key as? String {
                result[key] = pair.value
            }
        }
        return NonFiniteSanitizer.sanitizeEventData(stringKeyedPayload)
    }
}
