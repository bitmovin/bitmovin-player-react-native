import BitmovinPlayer
import ExpoModulesCore

public class SourceModule: Module {
    /// In-memory mapping from `nativeId`s to `Source` instances.
    private var sources: Registry<Source> = [:]
    /// In-memory mapping from `nativeId`s to `SourceConfig` instances for casting.
    private var castSourceConfigs: Registry<SourceConfig> = [:]

    public func definition() -> ModuleDefinition {
        Name("SourceModule")
        OnCreate {
            // Module initialization
        }
        OnDestroy {
            sources.removeAll()
            castSourceConfigs.removeAll()
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
    }
}

internal struct SourceRemoteControlConfig {
    let castSourceConfig: SourceConfig?
}
