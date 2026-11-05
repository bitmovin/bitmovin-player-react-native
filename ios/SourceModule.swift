import BitmovinPlayer
import Combine
import ExpoModulesCore

public class SourceModule: Module {
    /// In-memory mapping from `nativeId`s to `SourceConfig` instances for casting.
    private var castSourceConfigs: Registry<SourceConfig> = [:]
    /// Registry retaining native `FairplayContentKeyRequest` instances keyed by source nativeId + skdUri.
    private let fairplayRegistry = FairplayContentKeyRequestRegistry()
    /// Combine cancellables for FairPlay license acquired events, keyed by source nativeId.
    private var fairplayCancellables: [NativeId: AnyCancellable] = [:]
    private lazy var eventRelay = EventRelay<Source>(
        subscribers: PlayerEventTypes.source
    ) { [weak self] nativeId, eventName, event in
        self?.sendEvent("onSourceEvent", [
            "nativeId": nativeId,
            "eventName": eventName,
            "event": event.eventPayload(),
        ])
    }

    // swiftlint:disable:next function_body_length
    public func definition() -> ModuleDefinition {
        Name("SourceModule")
        OnCreate {
            // Module initialization
        }
        OnDestroy {
            // The event relay and the other state of this module must only be used on the main thread, which
            // `OnDestroy` is not guaranteed to run on. This also keeps the lazy event relay from being created on
            // another thread.
            DispatchQueue.main.async { [self] in
                eventRelay.clear()
                // Only this module's sources, not those of a new module instance, e.g. after a reload.
                SourceRegistry.unregisterAll(owner: self)
                castSourceConfigs.removeAll()
                fairplayCancellables.values.forEach { $0.cancel() }
                fairplayCancellables.removeAll()
            }
        }

        Events("onSourceEvent")

        // MARK: - Module methods
        AsyncFunction("on") { [weak self] (nativeId: NativeId, eventName: String) in
            self?.eventRelay.on(nativeId: nativeId, emitter: self?.retrieve(nativeId), eventName: eventName)
        }.runOnQueue(.main)
        AsyncFunction("off") { [weak self] (nativeId: NativeId, eventName: String) in
            self?.eventRelay.off(nativeId: nativeId, eventName: eventName)
        }.runOnQueue(.main)
        AsyncFunction("initializeWithConfig") { [weak self] (nativeId: NativeId, drmNativeId: NativeId?, config: [String: Any]?, sourceRemoteControlConfig: [String: Any]?) -> Bool in // swiftlint:disable:this line_length
            self?.createSource(
                nativeId: nativeId,
                drmNativeId: drmNativeId,
                config: config,
                sourceRemoteControlConfig: sourceRemoteControlConfig
            ) ?? false
        }.runOnQueue(.main)
        AsyncFunction("initializeWithAnalyticsConfig") { [weak self] (nativeId: NativeId, drmNativeId: NativeId?, config: [String: Any]?, sourceRemoteControlConfig: [String: Any]?, analyticsSourceMetadata: [String: Any]?) -> Bool in // swiftlint:disable:this line_length
            self?.createSource(
                nativeId: nativeId,
                drmNativeId: drmNativeId,
                config: config,
                sourceRemoteControlConfig: sourceRemoteControlConfig,
                analyticsSourceMetadata: analyticsSourceMetadata
            ) ?? false
        }.runOnQueue(.main)
        AsyncFunction("destroy") { [weak self] (nativeId: NativeId) in
            self?.destroySource(nativeId: nativeId)
        }.runOnQueue(.main)
        AsyncFunction("isAttachedToPlayer") { [weak self] (nativeId: NativeId) -> Bool? in
            self?.retrieve(nativeId)?.isAttachedToPlayer
        }.runOnQueue(.main)
        AsyncFunction("isActive") { [weak self] (nativeId: NativeId) -> Bool? in
            self?.retrieve(nativeId)?.isActive
        }.runOnQueue(.main)
        AsyncFunction("duration") { [weak self] (nativeId: NativeId) -> Double? in
            self?.retrieve(nativeId)?.duration
        }.runOnQueue(.main)
        AsyncFunction("loadingState") { [weak self] (nativeId: NativeId) -> Int? in
            self?.retrieve(nativeId)?.loadingState.rawValue
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
            guard let source = self?.retrieve(nativeId),
                  let contentKeyRequest = self?.fairplayRegistry.retrieve(nativeId: nativeId, skdUri: skdUri) else {
                return
            }
            source.drm.fairplay.renewExpiringLicense(for: contentKeyRequest)
        }.runOnQueue(.main)
    }

    // MARK: - Public methods
    public func retrieve(_ nativeId: NativeId) -> Source? {
        SourceRegistry.source(nativeId: nativeId)
    }

    // Finds `NativeId` based on predicate ran on `Source` instances
    public func nativeId(where predicate: (Source) -> Bool) -> NativeId? {
        SourceRegistry.nativeId(where: predicate)
    }

    public func retrieveCastSourceConfig(_ nativeId: NativeId) -> SourceConfig? {
        castSourceConfigs[nativeId]
    }

    // MARK: - Private methods
    private func getSourceMetadata(nativeId: NativeId) -> [String: Any]? {
        retrieve(nativeId)?.metadata
    }

    private func setSourceMetadata(nativeId: NativeId, metadata: [String: Any]?) {
        guard let metadata else {
            retrieve(nativeId)?.metadata = nil
            return
        }
        let metadataObjects = metadata as [String: AnyObject]
        retrieve(nativeId)?.metadata = metadataObjects
    }

    private func getSourceThumbnail(nativeId: NativeId, time: Double) -> [String: Any]? {
        guard let thumbnail = retrieve(nativeId)?.thumbnail(forTime: time) else {
            return nil
        }
        return RCTConvert.toJson(thumbnail: thumbnail)
    }

    /**
     Creates and registers the source with the given `nativeId`.

     - Returns: Whether a new source was created, `false` if it already exists or `config` is invalid.
     */
    private func createSource(
        nativeId: NativeId,
        drmNativeId: NativeId?,
        config: [String: Any]?,
        sourceRemoteControlConfig: [String: Any]?,
        analyticsSourceMetadata: [String: Any]? = nil
    ) -> Bool {
        guard retrieve(nativeId) == nil else {
            // Source already exists
            return false
        }
        // Get DRM config if provided
        let drmModule = appContext?.moduleRegistry.get(DrmModule.self)
        let drmConfig = drmNativeId.flatMap { drmModule?.retrieve($0) }
        guard let sourceConfig = RCTConvert.sourceConfig(config, drmConfig: drmConfig) else {
            return false
        }
        // Add analytics metadata if provided
        let sourceMetadata = RCTConvert.analyticsSourceMetadata(analyticsSourceMetadata)

        let source: Source
        if let sourceMetadata {
            source = SourceFactory.createSource(from: sourceConfig, sourceMetadata: sourceMetadata)
        } else {
            source = SourceFactory.createSource(from: sourceConfig)
        }
        SourceRegistry.register(source, nativeId: nativeId, owner: self)
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
        return true
    }

    /**
     Destroys the source instance with the given `nativeId`.
     */
    private func destroySource(nativeId: NativeId) {
        eventRelay.offAll(nativeId: nativeId)
        SourceRegistry.unregister(nativeId: nativeId)
        castSourceConfigs.removeValue(forKey: nativeId)
        fairplayCancellables[nativeId]?.cancel()
        fairplayCancellables.removeValue(forKey: nativeId)
        fairplayRegistry.removeAll(nativeId: nativeId)
    }
}

internal struct SourceRemoteControlConfig {
    let castSourceConfig: SourceConfig?
}
