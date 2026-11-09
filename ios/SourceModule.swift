import BitmovinPlayer
import Combine
import ExpoModulesCore

public class SourceModule: Module {
    public func definition() -> ModuleDefinition {
        Name("SourceModule")
        AsyncFunction("create") { (config: [String: Any]?, drm: SharedDrmConfig?, remote: [String: Any]?, analytics: [String: Any]?) -> SharedSource in // swiftlint:disable:this line_length
            guard let sourceConfig = RCTConvert.sourceConfig(config, drmConfig: drm?.config) else {
                throw Exception(name: "InvalidSourceConfig", description: "Invalid source configuration")
            }
            let source: Source
            if let metadata = RCTConvert.analyticsSourceMetadata(analytics) {
                source = SourceFactory.createSource(from: sourceConfig, sourceMetadata: metadata)
            } else {
                source = SourceFactory.createSource(from: sourceConfig)
            }
            return SharedSource(source: source, drm: drm, remote: remote)
        }.runOnQueue(.main)
        Class("Source", SharedSource.self) {
            AsyncFunction("isAttachedToPlayer") { (owner: SharedSource) -> Bool? in
                owner.source.isAttachedToPlayer
            }.runOnQueue(.main)
            AsyncFunction("isActive") { (owner: SharedSource) -> Bool? in
                owner.source.isActive
            }.runOnQueue(.main)
            AsyncFunction("duration") { (owner: SharedSource) -> Double? in
                owner.source.duration
            }.runOnQueue(.main)
            AsyncFunction("loadingState") { (owner: SharedSource) -> Int? in
                owner.source.loadingState.rawValue
            }.runOnQueue(.main)
            AsyncFunction("getMetadata") { (owner: SharedSource) -> [String: Any]? in
                let source = owner.source
                if let metadata = source.metadata { return metadata }
                let metadata = source.sourceConfig.metadata
                return metadata.isEmpty ? nil : metadata
            }.runOnQueue(.main)
            AsyncFunction("setMetadata") { (owner: SharedSource, metadata: [String: Any]?) in
                let source = owner.source
                source.sourceConfig.metadata = metadata ?? [:]
                source.metadata = metadata as [String: AnyObject]?
            }.runOnQueue(.main)
            AsyncFunction("getThumbnail") { (owner: SharedSource, time: Double) -> [String: Any]? in
                guard let thumbnail = owner.source.thumbnail(forTime: time) else { return nil }
                return RCTConvert.toJson(thumbnail: thumbnail)
            }.runOnQueue(.main)
            AsyncFunction("drmFairplayRenewExpiringLicense") { (owner: SharedSource, skdUri: String) in
                guard let request = owner.fairplayRequests.value[skdUri] else { return }
                owner.source.drm.fairplay.renewExpiringLicense(for: request)
            }.runOnQueue(.main)
        }
    }
}

public final class SharedSource: SharedObject {
    let source: Source
    let castSourceConfig: SourceConfig?
    // The public API returns plain skdUri metadata; renewal still needs its native AVContentKeyRequest.
    fileprivate let fairplayRequests = LockedBox(value: [String: FairplayContentKeyRequest]())
    private var fairplayCancellable: AnyCancellable?
    private let drm: SharedDrmConfig?

    fileprivate init(source: Source, drm: SharedDrmConfig?, remote: [String: Any]?) {
        self.source = source
        self.drm = drm
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
}
