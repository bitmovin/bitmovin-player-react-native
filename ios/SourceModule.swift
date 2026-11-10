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
        AsyncFunction("getSharedSource") { (nativeId: NativeId) -> SharedSource in
            guard let owner = SourceRegistry.sharedSource(nativeId: nativeId) else {
                throw Exception(name: "SourceNotInitialized", description: "Source has not been initialized")
            }
            return owner
        }.runOnQueue(.main)
        Class("Source", SharedSource.self) {
            AsyncFunction("isAttachedToPlayer") { (owner: SharedSource) -> Bool in
                owner.source.isAttachedToPlayer
            }.runOnQueue(.main)
            AsyncFunction("isActive") { (owner: SharedSource) -> Bool in owner.source.isActive }.runOnQueue(.main)
            AsyncFunction("duration") { (owner: SharedSource) -> Double in owner.source.duration }.runOnQueue(.main)
            AsyncFunction("loadingState") { (owner: SharedSource) -> Int in
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
        }
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

        Events("onSourceEvent", "onSourceReleased")

        // MARK: - Module methods
        AsyncFunction("on") { [weak self] (nativeId: NativeId, eventName: String) in
            self?.eventRelay.on(nativeId: nativeId, emitter: self?.retrieve(nativeId), eventName: eventName)
        }.runOnQueue(.main)
        AsyncFunction("off") { [weak self] (nativeId: NativeId, eventName: String) in
            self?.eventRelay.off(nativeId: nativeId, eventName: eventName)
        }.runOnQueue(.main)
        AsyncFunction("initializeWithConfig") { [weak self] (nativeId: NativeId, drmNativeId: NativeId?, config: [String: Any]?, sourceRemoteControlConfig: [String: Any]?) -> Int? in // swiftlint:disable:this line_length
            self?.createSource(
                nativeId: nativeId,
                drmNativeId: drmNativeId,
                config: config,
                sourceRemoteControlConfig: sourceRemoteControlConfig
            )
        }.runOnQueue(.main)
        AsyncFunction("initializeWithAnalyticsConfig") { [weak self] (nativeId: NativeId, drmNativeId: NativeId?, config: [String: Any]?, sourceRemoteControlConfig: [String: Any]?, analyticsSourceMetadata: [String: Any]?) -> Int? in // swiftlint:disable:this line_length
            self?.createSource(
                nativeId: nativeId,
                drmNativeId: drmNativeId,
                config: config,
                sourceRemoteControlConfig: sourceRemoteControlConfig,
                analyticsSourceMetadata: analyticsSourceMetadata
            )
        }.runOnQueue(.main)
        AsyncFunction("destroy") { [weak self] (nativeId: NativeId) in
            self?.releaseSource(nativeId: nativeId)
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
    /**
     Creates and registers the source with the given `nativeId`.

     - Returns: The instance id of the newly created source, or `nil` if it already exists or `config` is invalid.
     */
    private func createSource(
        nativeId: NativeId,
        drmNativeId: NativeId?,
        config: [String: Any]?,
        sourceRemoteControlConfig: [String: Any]?,
        analyticsSourceMetadata: [String: Any]? = nil
    ) -> Int? {
        if let existingSource = retrieve(nativeId) {
            // Keep the source if its release is pending, e.g. because it is added again right after it was removed.
            appContext?.moduleRegistry.get(PlayerModule.self)?.keepSource(existingSource)
            return nil
        }
        // Get DRM config if provided
        let drmModule = appContext?.moduleRegistry.get(DrmModule.self)
        let drmConfig = drmNativeId.flatMap { drmModule?.retrieve($0) }
        guard let sourceConfig = RCTConvert.sourceConfig(config, drmConfig: drmConfig) else {
            return nil
        }
        // Add analytics metadata if provided
        let sourceMetadata = RCTConvert.analyticsSourceMetadata(analyticsSourceMetadata)

        let source: Source
        if let sourceMetadata {
            source = SourceFactory.createSource(from: sourceConfig, sourceMetadata: sourceMetadata)
        } else {
            source = SourceFactory.createSource(from: sourceConfig)
        }
        let instanceId = SourceRegistry.register(source, nativeId: nativeId, owner: self)
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
        return instanceId
    }

    /**
     Releases the bridge's handle of the source with the given `nativeId`: detaches its event listeners and removes it
     from the `SourceRegistry`. The native `Source` itself is not touched.

     Emits `onSourceReleased` if the source was registered, so that JS releases its resources of the source as well,
     e.g. its DRM config.
     */
    internal func releaseSource(nativeId: NativeId) {
        eventRelay.offAll(nativeId: nativeId)
        let removed = SourceRegistry.unregister(nativeId: nativeId)
        castSourceConfigs.removeValue(forKey: nativeId)
        fairplayCancellables[nativeId]?.cancel()
        fairplayCancellables.removeValue(forKey: nativeId)
        fairplayRegistry.removeAll(nativeId: nativeId)
        if let removed {
            sendEvent("onSourceReleased", ["nativeId": nativeId, "instanceId": removed.instanceId])
        }
    }
}

internal struct SourceRemoteControlConfig {
    let castSourceConfig: SourceConfig?
}
