import BitmovinPlayer
import ObjectiveC

/// Keeps native renewal requests with the SDK source, including across queried JS handles.
internal final class SourceFairplayRequests: NSObject, SourceListener {
    private static var associationKey: UInt8 = 0
    private let requests = LockedBox(value: [String: FairplayContentKeyRequest]())

    static func attached(to source: Source) -> SourceFairplayRequests {
        objc_sync_enter(source)
        defer { objc_sync_exit(source) }
        if let existing = objc_getAssociatedObject(source, &associationKey) as? Self {
            return existing
        }
        let store = Self()
        objc_setAssociatedObject(source, &associationKey, store, .OBJC_ASSOCIATION_RETAIN_NONATOMIC)
        source.add(listener: store)
        return store
    }

    func request(for skdUri: String) -> FairplayContentKeyRequest? {
        requests.value[skdUri]
    }

    func onFairplayLicenseAcquired(_ event: FairplayLicenseAcquiredEvent, source: Source) {
        requests.update { $0[event.contentKeyRequest.skdUri] = event.contentKeyRequest }
    }

    func onSourceUnloaded(_ event: SourceUnloadedEvent, source: Source) {
        requests.update([:])
    }
}
