import BitmovinPlayer
import Combine
import ExpoModulesCore

public final class SharedSource: SharedObject {
    let source: Source
    let castSourceConfig: SourceConfig?
    // The public API returns plain skdUri metadata; renewal still needs its native AVContentKeyRequest.
    let fairplayRequests = LockedBox(value: [String: FairplayContentKeyRequest]())
    private var fairplayCancellable: AnyCancellable?
    private let callback: CallbackScope?

    init(source: Source, callback: CallbackScope?, remote: [String: Any]?) {
        self.source = source
        self.callback = callback
#if os(iOS)
        castSourceConfig = RCTConvert.sourceRemoteControlConfig(remote)
#else
        castSourceConfig = nil
#endif
        super.init()
        fairplayCancellable = source.events
            .on(FairplayLicenseAcquiredEvent.self)
            .sink { [weak self] event in
                self?.fairplayRequests.update { requests in
                    requests[event.contentKeyRequest.skdUri] = event.contentKeyRequest
                }
            }
    }
    deinit { callback?.close() }
    override public func sharedObjectWillRelease() { callback?.close() }
}
