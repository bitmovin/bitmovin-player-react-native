import BitmovinPlayer
import Combine
import ExpoModulesCore

public final class SharedSource: SharedObject {
    let source: Source
    // The public API returns plain skdUri metadata; renewal still needs its native AVContentKeyRequest.
    let fairplayRequests = LockedBox(value: [String: FairplayContentKeyRequest]())
    private var fairplayCancellable: AnyCancellable?
    private let events = SharedObjectEvents()
    private let callback: CallbackScope?

    init(source: Source, callback: CallbackScope?) {
        self.source = source
        self.callback = callback
        super.init()
        events.owner = self
        source.add(listener: events)
        fairplayCancellable = source.events
            .on(FairplayLicenseAcquiredEvent.self)
            .sink { [weak self] event in
                self?.fairplayRequests.update { requests in
                    requests[event.contentKeyRequest.skdUri] = event.contentKeyRequest
                }
            }
    }
    deinit {
        callback?.close()
        let source = source
        let events = events
        DispatchQueue.main.async {
            source.remove(listener: events)
        }
    }
    override public func sharedObjectWillRelease() { callback?.close() }
}
