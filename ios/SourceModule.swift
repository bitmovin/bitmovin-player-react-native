import BitmovinPlayer
import ExpoModulesCore
import ExpoModulesJSI

public class SourceModule: Module {
    /// In-memory mapping from `nativeId`s to `SourceConfig` instances for casting.
    private var castSourceConfigs: Registry<SourceConfig> = [:]
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
            Property("legacyInstanceId") { (owner: SharedSource) -> Int in owner.legacyInstanceId }
            AsyncFunction("drmFairplayRenewExpiringLicense") { (owner: SharedSource, skdUri: String) in
                guard let request = owner.fairplayRequests.request(for: skdUri) else { return }
                owner.source.drm.fairplay.renewExpiringLicense(for: request)
            }.runOnQueue(.main)
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
        AsyncFunction("initializeWithConfig") { (nativeId: NativeId, config: [String: Any]?, remote: [String: Any]?, callback: JavaScriptValue?) -> SharedSource in // swiftlint:disable:this line_length
            try self.createSource(
                nativeId: nativeId, config: config, sourceRemoteControlConfig: remote, callbackValue: callback
            )
        }.runOnQueue(.main)
        AsyncFunction("initializeWithAnalyticsConfig") { (nativeId: NativeId, config: [String: Any]?, remote: [String: Any]?, analytics: [String: Any]?, callback: JavaScriptValue?) -> SharedSource in // swiftlint:disable:this line_length
            try self.createSource(
                nativeId: nativeId,
                config: config,
                sourceRemoteControlConfig: remote,
                callbackValue: callback,
                analyticsSourceMetadata: analytics
            )
        }.runOnQueue(.main)
        AsyncFunction("destroy") { [weak self] (nativeId: NativeId) in
            self?.releaseSource(nativeId: nativeId)
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

     - Returns: The canonical shared source, creating it when necessary.
     */
    private func createSource(
        nativeId: NativeId,
        config: [String: Any]?,
        sourceRemoteControlConfig: [String: Any]?,
        callbackValue: JavaScriptValue?,
        analyticsSourceMetadata: [String: Any]? = nil
    ) throws -> SharedSource {
        if let existing = SourceRegistry.sharedSource(nativeId: nativeId) {
            // Keep the source if its release is pending, e.g. because it is added again right after it was removed.
            appContext?.moduleRegistry.get(PlayerModule.self)?.keepSource(existing.source)
            return existing
        }
        let callback = try callbackValue.map { try CallbackScope(callback: $0, context: appContext) }
        guard let sourceConfig = RCTConvert.sourceConfig(config, callback: callback) else {
            callback?.close()
            throw Exception(name: "InvalidSourceConfig", description: "Invalid source configuration")
        }
        // Add analytics metadata if provided
        let sourceMetadata = RCTConvert.analyticsSourceMetadata(analyticsSourceMetadata)

        let source: Source
        if let sourceMetadata {
            source = SourceFactory.createSource(from: sourceConfig, sourceMetadata: sourceMetadata)
        } else {
            source = SourceFactory.createSource(from: sourceConfig)
        }
        SourceRegistry.register(source, nativeId: nativeId, owner: self, callback: callback)
        // Store cast source config if provided
#if os(iOS)
        if let remoteConfig = RCTConvert.sourceRemoteControlConfig(sourceRemoteControlConfig) {
            castSourceConfigs[nativeId] = remoteConfig.castSourceConfig
        }
#endif
        guard let owner = SourceRegistry.sharedSource(nativeId: nativeId) else {
            callback?.close()
            throw Exception(name: "SourceNotInitialized", description: "Source registration failed")
        }
        return owner
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
        if let removed {
            sendEvent("onSourceReleased", ["nativeId": nativeId, "instanceId": removed.instanceId])
        }
    }
}

internal struct SourceRemoteControlConfig {
    let castSourceConfig: SourceConfig?
}
