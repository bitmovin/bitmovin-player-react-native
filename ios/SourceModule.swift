import BitmovinPlayer
import Combine
import ExpoModulesCore

public class SourceModule: Module {
    /// In-memory mapping from `nativeId`s to `Source` instances.
    private var sources: Registry<Source> = [:]
    /// In-memory mapping from `nativeId`s to `SourceConfig` instances for casting.
    private var castSourceConfigs: Registry<SourceConfig> = [:]
    /// Registry retaining native `FairplayContentKeyRequest` instances keyed by source nativeId + skdUri.
    private let fairplayRegistry = FairplayContentKeyRequestRegistry()
    /// Combine cancellables for FairPlay license acquired events, keyed by source nativeId.
    private var fairplayCancellables: [NativeId: AnyCancellable] = [:]

    // swiftlint:disable:next function_body_length
    public func definition() -> ModuleDefinition {
        Name("SourceModule")
        OnCreate {
            // Module initialization
        }
        OnDestroy {
            sources.removeAll()
            castSourceConfigs.removeAll()
            fairplayCancellables.values.forEach { $0.cancel() }
            fairplayCancellables.removeAll()
        }

        // MARK: - Module methods
        AsyncFunction("initializeWithConfig") { [weak self] (nativeId: NativeId, drmNativeId: NativeId?, config: [String: Any]?, sourceRemoteControlConfig: [String: Any]?) in // swiftlint:disable:this line_length
            self?.createSource(
                nativeId: nativeId,
                drmNativeId: drmNativeId,
                config: config,
                sourceRemoteControlConfig: sourceRemoteControlConfig
            )
        }.runOnQueue(.main)
        AsyncFunction("initializeWithAnalyticsConfig") { [weak self] (nativeId: NativeId, drmNativeId: NativeId?, config: [String: Any]?, sourceRemoteControlConfig: [String: Any]?, analyticsSourceMetadata: [String: Any]?) in // swiftlint:disable:this line_length
            self?.createSource(
                nativeId: nativeId,
                drmNativeId: drmNativeId,
                config: config,
                sourceRemoteControlConfig: sourceRemoteControlConfig,
                analyticsSourceMetadata: analyticsSourceMetadata
            )
        }.runOnQueue(.main)
        AsyncFunction("destroy") { [weak self] (nativeId: NativeId) in
            self?.destroySource(nativeId: nativeId)
        }.runOnQueue(.main)
        AsyncFunction("isAttachedToPlayer") { [weak self] (nativeId: NativeId) -> Bool? in
            self?.sources[nativeId]?.isAttachedToPlayer
        }.runOnQueue(.main)
        AsyncFunction("isActive") { [weak self] (nativeId: NativeId) -> Bool? in
            self?.sources[nativeId]?.isActive
        }.runOnQueue(.main)
        AsyncFunction("duration") { [weak self] (nativeId: NativeId) -> Double? in
            self?.sources[nativeId]?.duration
        }.runOnQueue(.main)
        AsyncFunction("loadingState") { [weak self] (nativeId: NativeId) -> Int? in
            self?.sources[nativeId]?.loadingState.rawValue
        }.runOnQueue(.main)
        AsyncFunction("getMetadata") { [weak self] (nativeId: NativeId) -> [String: Any]? in
            self?.getSourceMetadata(nativeId: nativeId)
        }.runOnQueue(.main)
        AsyncFunction("setMetadata") { [weak self] (nativeId: NativeId, metadata: [String: Any]?) in
            self?.setSourceMetadata(nativeId: nativeId, metadata: metadata)
        }.runOnQueue(.main)
        AsyncFunction("getThumbnail") { [weak self] (nativeId: NativeId, time: Double) -> [String: Any]? in
            self?.getSourceThumbnail(nativeId: nativeId, time: time)
        }.runOnQueue(.main)
        AsyncFunction("drmFairplayRenewExpiringLicense") { [weak self] (nativeId: NativeId, skdUri: String) in
            guard let source = self?.sources[nativeId],
                  let contentKeyRequest = self?.fairplayRegistry.retrieve(nativeId: nativeId, skdUri: skdUri) else {
                return
            }
            source.drm.fairplay.renewExpiringLicense(for: contentKeyRequest)
        }.runOnQueue(.main)
    }

    // MARK: - Public methods
    public func retrieve(_ nativeId: NativeId) -> Source? {
        sources[nativeId]
    }

    // Finds `NativeId` based on predicate ran on `Source` instances
    public func nativeId(where predicate: (Source) -> Bool) -> NativeId? {
        sources.first { _, value in
            predicate(value)
        }?.key
    }

    public func retrieveCastSourceConfig(_ nativeId: NativeId) -> SourceConfig? {
        castSourceConfigs[nativeId]
    }

    // MARK: - Private methods
    private func getSourceMetadata(nativeId: NativeId) -> [String: Any]? {
        sources[nativeId]?.metadata
    }

    private func setSourceMetadata(nativeId: NativeId, metadata: [String: Any]?) {
        guard let metadata else {
            sources[nativeId]?.metadata = nil
            return
        }
        let metadataObjects = metadata as [String: AnyObject]
        sources[nativeId]?.metadata = metadataObjects
    }

    private func getSourceThumbnail(nativeId: NativeId, time: Double) -> [String: Any]? {
        guard let thumbnail = sources[nativeId]?.thumbnail(forTime: time) else {
            return nil
        }
        return RCTConvert.toJson(thumbnail: thumbnail)
    }

    private func createSource(
        nativeId: NativeId,
        drmNativeId: NativeId?,
        config: [String: Any]?,
        sourceRemoteControlConfig: [String: Any]?,
        analyticsSourceMetadata: [String: Any]? = nil
    ) {
        guard sources[nativeId] == nil else {
            // Source already exists
            return
        }
        // Get DRM config if provided
        let drmModule = appContext?.moduleRegistry.get(DrmModule.self)
        let drmConfig = drmNativeId.flatMap { drmModule?.retrieve($0) }
        guard let sourceConfig = RCTConvert.sourceConfig(config, drmConfig: drmConfig) else {
            return
        }
        // Add analytics metadata if provided
        let sourceMetadata = RCTConvert.analyticsSourceMetadata(analyticsSourceMetadata)

        let source: Source
        if let sourceMetadata {
            source = SourceFactory.createSource(from: sourceConfig, sourceMetadata: sourceMetadata)
        } else {
            source = SourceFactory.createSource(from: sourceConfig)
        }
        sources[nativeId] = source
        // Attach Combine listener to populate the FairPlay registry when a license is acquired
        fairplayCancellables[nativeId] = source.events
            .on(FairplayLicenseAcquiredEvent.self)
            .sink { [weak self] event in
                self?.fairplayRegistry.store(nativeId: nativeId, contentKeyRequest: event.contentKeyRequest)
            }
        // Store cast source config if provided
#if os(iOS)
        if let remoteConfig = RCTConvert.sourceRemoteControlConfig(sourceRemoteControlConfig) {
            castSourceConfigs[nativeId] = remoteConfig.castSourceConfig
        }
#endif
    }

    /**
     Destroys the source instance with the given `nativeId`.
     */
    private func destroySource(nativeId: NativeId) {
        sources.removeValue(forKey: nativeId)
        castSourceConfigs.removeValue(forKey: nativeId)
        fairplayCancellables[nativeId]?.cancel()
        fairplayCancellables.removeValue(forKey: nativeId)
        fairplayRegistry.removeAll(nativeId: nativeId)
    }
}

internal struct SourceRemoteControlConfig {
    let castSourceConfig: SourceConfig?
}
