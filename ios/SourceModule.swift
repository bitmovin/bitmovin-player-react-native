import BitmovinPlayer
import Combine
import ExpoModulesCore

public class SourceModule: Module {
    public func definition() -> ModuleDefinition {
        Name("SourceModule")
        Function("createEmpty") { SharedSource() }
        AsyncFunction("create") { (config: [String: Any]?, drm: SharedDrm?, remote: [String: Any]?, analytics: [String: Any]?) -> SharedSource in // swiftlint:disable:this line_length
            let owner = SharedSource()
            owner.createSource(
                drm: drm, config: config, sourceRemoteControlConfig: remote, analyticsSourceMetadata: analytics
            )
            return owner
        }.runOnQueue(.main)
        Class("Source", SharedSource.self) {
            AsyncFunction("destroy") { (owner: SharedSource) in
                owner.destroy()
            }.runOnQueue(.main)
            AsyncFunction("isAttachedToPlayer") { (owner: SharedSource) -> Bool? in
                owner.source?.isAttachedToPlayer
            }.runOnQueue(.main)
            AsyncFunction("isActive") { (owner: SharedSource) -> Bool? in
                owner.source?.isActive
            }.runOnQueue(.main)
            AsyncFunction("duration") { (owner: SharedSource) -> Double? in
                owner.source?.duration
            }.runOnQueue(.main)
            AsyncFunction("loadingState") { (owner: SharedSource) -> Int? in
                owner.source?.loadingState.rawValue
            }.runOnQueue(.main)
            AsyncFunction("getMetadata") { (owner: SharedSource) -> [String: Any]? in
                guard let source = owner.source else { return nil }
                if let metadata = source.metadata { return metadata }
                let metadata = source.sourceConfig.metadata
                return metadata.isEmpty ? nil : metadata
            }.runOnQueue(.main)
            AsyncFunction("setMetadata") { (owner: SharedSource, metadata: [String: Any]?) in
                guard let source = owner.source else { return }
                source.sourceConfig.metadata = metadata ?? [:]
                source.metadata = metadata as [String: AnyObject]?
            }.runOnQueue(.main)
            AsyncFunction("getThumbnail") { (owner: SharedSource, time: Double) -> [String: Any]? in
                guard let thumbnail = owner.source?.thumbnail(forTime: time) else { return nil }
                return RCTConvert.toJson(thumbnail: thumbnail)
            }.runOnQueue(.main)
            AsyncFunction("drmFairplayRenewExpiringLicense") { (owner: SharedSource, skdUri: String) in
                guard let source = owner.source,
                      let request = owner.fairplayRequests.value[skdUri] else { return }
                source.drm.fairplay.renewExpiringLicense(for: request)
            }.runOnQueue(.main)
        }
    }
}

public final class SharedSource: SharedObject {
    var source: Source?
    var castSourceConfig: SourceConfig?
    // The public API returns plain skdUri metadata; renewal still needs its native AVContentKeyRequest.
    fileprivate let fairplayRequests = LockedBox(value: [String: FairplayContentKeyRequest]())
    private var fairplayCancellable: AnyCancellable?
    private var isClosed = false
    private var drm: SharedDrm?

    // The player retains this owner while its source is loaded. JS association release must not
    // invalidate the SDK source or callbacks. ARC releases the source and subscription together.
    fileprivate func createSource(
        drm: SharedDrm?,
        config: [String: Any]?,
        sourceRemoteControlConfig: [String: Any]?,
        analyticsSourceMetadata: [String: Any]? = nil
    ) {
        guard !isClosed, source == nil else { return }
        self.drm = drm
        guard let sourceConfig = RCTConvert.sourceConfig(config, drmConfig: drm?.config) else { return }
        let sourceMetadata = RCTConvert.analyticsSourceMetadata(analyticsSourceMetadata)
        let nativeSource: Source
        if let sourceMetadata {
            nativeSource = SourceFactory.createSource(from: sourceConfig, sourceMetadata: sourceMetadata)
        } else {
            nativeSource = SourceFactory.createSource(from: sourceConfig)
        }
        source = nativeSource
        fairplayCancellable = nativeSource.events
            .on(FairplayLicenseAcquiredEvent.self)
            .sink { [weak self] event in
                self?.fairplayRequests.update { requests in
                    requests[event.contentKeyRequest.skdUri] = event.contentKeyRequest
                }
            }
#if os(iOS)
        castSourceConfig = RCTConvert.sourceRemoteControlConfig(sourceRemoteControlConfig)?.castSourceConfig
#endif
    }

    fileprivate func destroy() {
        isClosed = true
        source = nil
        drm = nil
        castSourceConfig = nil
        fairplayCancellable?.cancel()
        fairplayCancellable = nil
        fairplayRequests.update { $0.removeAll() }
    }
}

internal struct SourceRemoteControlConfig {
    let castSourceConfig: SourceConfig?
}
