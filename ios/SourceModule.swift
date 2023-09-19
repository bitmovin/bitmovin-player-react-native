import BitmovinPlayer

@objc(SourceModule)
class SourceModule: NSObject, RCTBridgeModule {
    /// React bridge reference.
    @objc var bridge: RCTBridge!

    /// In-memory mapping from `nativeId`s to `Source` instances.
    private var sources: Registry<Source> = [:]

    /// JS module name.
    static func moduleName() -> String! {
        "SourceModule"
    }

    /// Module requires main thread initialization.
    static func requiresMainQueueSetup() -> Bool {
        true
    }

    /// Use `UIManager.addBlock` to enqueue module methods on UI thread.
    var methodQueue: DispatchQueue! {
        bridge.uiManager.methodQueue
    }

    /**
     Fetches the `Source` instance associated with `nativeId` from internal sources.
     - Parameter nativeId: `Source` instance ID.
     - Returns: The associated `Source` instance or `nil`.
     */
    @objc func retrieve(_ nativeId: NativeId) -> Source? {
        sources[nativeId]
    }

    /**
     Creates a new `Source` instance inside the internal sources using the provided `config` and `analyticsSourceMetadata` object and an optionally initialized DRM configuration ID.
     - Parameter nativeId: ID to be associated with the `Source` instance.
     - Parameter drmNativeId: ID of the DRM config object to use.
     - Parameter config: `SourceConfig` object received from JS.
     - Parameter analyticsSourceMetadata: `SourceMetadata` object received from JS.
     */
    @objc(initWithAnalyticsConfig:drmNativeId:config:analyticsSourceMetadata:)
    func initWithAnalyticsConfig(_ nativeId: NativeId, drmNativeId: NativeId?, config: Any?, analyticsSourceMetadata: Any?) {
        bridge.uiManager.addUIBlock { [weak self] _, _ in
            let fairplayConfig: FairplayConfig?
            if let drmNativeId = drmNativeId {
                fairplayConfig = self?.getDrmModule()?.retrieve(drmNativeId)
            } else {
                fairplayConfig = nil
            }

            guard
                self?.sources[nativeId] == nil,
                let sourceConfig = RCTConvert.sourceConfig(config, drmConfig: fairplayConfig),
                let sourceMetadata = RCTConvert.analyticsSourceMetadata(analyticsSourceMetadata)
            else {
                return
            }
            self?.sources[nativeId] = SourceFactory.create(from: sourceConfig, sourceMetadata: sourceMetadata)
        }
    }

    /**
     Creates a new `Source` instance inside the internal sources using the provided `config` object and an initialized DRM configuration ID.
     - Parameter nativeId: ID to be associated with the `Source` instance.
     - Parameter drmNativeId: ID of the DRM config object to use.
     - Parameter config: `SourceConfig` object received from JS.
     */
    @objc(initWithConfig:drmNativeId:config:)
    func initWithConfig(_ nativeId: NativeId, drmNativeId: NativeId?, config: Any?) {
        bridge.uiManager.addUIBlock { [weak self] _, _ in
            let fairplayConfig: FairplayConfig?
            if let drmNativeId = drmNativeId {
                fairplayConfig = self?.getDrmModule()?.retrieve(drmNativeId)
            } else {
                fairplayConfig = nil
            }

            guard
                self?.sources[nativeId] == nil,
                let sourceConfig = RCTConvert.sourceConfig(config, drmConfig: fairplayConfig)
            else {
                return
            }
            self?.sources[nativeId] = SourceFactory.create(from: sourceConfig)
        }
    }

    /// Fetches the initialized `DrmModule` instance on RN's bridge object.
    private func getDrmModule() -> DrmModule? {
        bridge.module(for: DrmModule.self) as? DrmModule
    }

    /**
     Removes the `Source` instance associated with `nativeId` from `sources`.
     - Parameter nativeId: Instance to be disposed.
     */
    @objc(destroy:)
    func destroy(_ nativeId: NativeId) {
        sources.removeValue(forKey: nativeId)
    }

    /**
     Whether `nativeId` source is currently attached to a player instance.
     - Parameter nativeId: Source `nativeId`.
     - Parameter resolver: JS promise resolver.
     - Parameter rejecter: JS promise rejecter.
     */
    @objc(isAttachedToPlayer:resolver:rejecter:)
    func isAttachedToPlayer(
        _ nativeId: NativeId,
        resolver resolve: @escaping RCTPromiseResolveBlock,
        rejecter reject: @escaping RCTPromiseRejectBlock
    ) {
        bridge.uiManager.addUIBlock { [weak self] _, _ in
            resolve(self?.sources[nativeId]?.isAttachedToPlayer)
        }
    }

    /**
     Whether `nativeId` source is currently active in a `Player`.
     - Parameter nativeId: Source `nativeId`.
     - Parameter resolver: JS promise resolver.
     - Parameter rejecter: JS promise rejecter.
     */
    @objc(isActive:resolver:rejecter:)
    func isActive(
        _ nativeId: NativeId,
        resolver resolve: @escaping RCTPromiseResolveBlock,
        rejecter reject: @escaping RCTPromiseRejectBlock
    ) {
        bridge.uiManager.addUIBlock { [weak self] _, _ in
            resolve(self?.sources[nativeId]?.isActive)
        }
    }

    /**
     The duration of `nativeId` source in seconds.
     - Parameter nativeId: Source `nativeId`.
     - Parameter resolver: JS promise resolver.
     - Parameter rejecter: JS promise rejecter.
     */
    @objc(duration:resolver:rejecter:)
    func duration(
        _ nativeId: NativeId,
        resolver resolve: @escaping RCTPromiseResolveBlock,
        rejecter reject: @escaping RCTPromiseRejectBlock
    ) {
        bridge.uiManager.addUIBlock { [weak self] _, _ in
            resolve(self?.sources[nativeId]?.duration)
        }
    }

    /**
     The current loading state of `nativeId` source.
     - Parameter nativeId: Source `nativeId`.
     - Parameter resolver: JS promise resolver.
     - Parameter rejecter: JS promise rejecter.
     */
    @objc(loadingState:resolver:rejecter:)
    func loadingState(
        _ nativeId: NativeId,
        resolver resolve: @escaping RCTPromiseResolveBlock,
        rejecter reject: @escaping RCTPromiseRejectBlock
    ) {
        bridge.uiManager.addUIBlock { [weak self] _, _ in
            resolve(self?.sources[nativeId]?.loadingState)
        }
    }

    /**
     Metadata for the currently loaded `nativeId` source.
     - Parameter nativeId: Source `nativeId`.
     - Parameter resolver: JS promise resolver.
     - Parameter rejecter: JS promise rejecter.
     */
    @objc(getMetadata:resolver:rejecter:)
    func getMetadata(
        _ nativeId: NativeId,
        resolver resolve: @escaping RCTPromiseResolveBlock,
        rejecter reject: @escaping RCTPromiseRejectBlock
    ) {
        bridge.uiManager.addUIBlock { [weak self] _, _ in
            resolve(self?.sources[nativeId]?.metadata)
        }
    }

    /**
     Set the metadata for a loaded `nativeId` source.
     - Parameter nativeId: Source `nativeId`.
     - Parameter resolver: JS promise resolver.
     - Parameter rejecter: JS promise rejecter.
     */
    @objc(setMetadata:metadata:)
    func setMetadata(_ nativeId: NativeId, metadata: Any?) {
        bridge.uiManager.addUIBlock { [weak self] _, _ in
            guard let metadata = metadata as? [String: AnyObject] else {
                return
            }
            self?.sources[nativeId]?.metadata = metadata
        }
    }

    /**
     Returns the thumbnail image for the `Source` at a certain time.
     - Parameter nativeId: Target player id.
     - Parameter resolver: JS promise resolver.
     - Parameter rejecter: JS promise rejecter.
     */
    @objc(getThumbnail:time:resolver:rejecter:)
    func getThumbnail(
        _ nativeId: NativeId,
        time: NSNumber,
        resolver resolve: @escaping RCTPromiseResolveBlock,
        rejecter reject: @escaping RCTPromiseRejectBlock
    ) {
        bridge.uiManager.addUIBlock { [weak self] _, _ in
            resolve(RCTConvert.toJson(thumbnail: self?.sources[nativeId]?.thumbnail(forTime: time.doubleValue)))
        }
    }
}
