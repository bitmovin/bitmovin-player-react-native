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
            // Clean up sources
            sources.removeAll()
            castSourceConfigs.removeAll()
        }

        // MARK: - Module methods
        AsyncFunction("initializeWithConfig") { [weak self] (nativeId: String, drmNativeId: String?, config: [String: Any]?, sourceRemoteControlConfig: [String: Any]?) in // swiftlint:disable:this line_length
            self?.createSource(
                nativeId: nativeId,
                drmNativeId: drmNativeId,
                config: config,
                sourceRemoteControlConfig: sourceRemoteControlConfig
            )
        }
        AsyncFunction("initializeWithAnalyticsConfig") { [weak self] (nativeId: String, drmNativeId: String?, config: [String: Any]?, sourceRemoteControlConfig: [String: Any]?, analyticsSourceMetadata: [String: Any]?) in // swiftlint:disable:this line_length
            self?.createSource(
                nativeId: nativeId,
                drmNativeId: drmNativeId,
                config: config,
                sourceRemoteControlConfig: sourceRemoteControlConfig,
                analyticsSourceMetadata: analyticsSourceMetadata
            )
        }
        AsyncFunction("destroy") { [weak self] (nativeId: String) in
            self?.destroySource(nativeId: nativeId)
        }
        AsyncFunction("isAttachedToPlayer") { [weak self] (nativeId: String) -> Bool? in
            self?.sources[nativeId]?.isAttachedToPlayer
        }
        AsyncFunction("isActive") { [weak self] (nativeId: String) -> Bool? in
            self?.sources[nativeId]?.isActive
        }
        AsyncFunction("duration") { [weak self] (nativeId: String) -> Double? in
            self?.sources[nativeId]?.duration
        }
        AsyncFunction("loadingState") { [weak self] (nativeId: String) -> Int? in
            self?.sources[nativeId]?.loadingState.rawValue
        }
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
    private func createSource(
        nativeId: String,
        drmNativeId: String?,
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
        if sourceRemoteControlConfig != nil {
            castSourceConfigs[nativeId] = sourceConfig
        }
    }

    /**
     Destroys the source instance with the given `nativeId`.
     */
    private func destroySource(nativeId: String) {
        sources.removeValue(forKey: nativeId)
        castSourceConfigs.removeValue(forKey: nativeId)
    }
}

internal struct SourceRemoteControlConfig {
    let castSourceConfig: SourceConfig?
}
