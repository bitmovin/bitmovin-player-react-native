import BitmovinPlayer

@objc(SourceModule)
class SourceModule: NSObject, RCTBridgeModule {
    /// React bridge reference.
    @objc var bridge: RCTBridge!

    /// Mapping between UUID values and `Source` objects.
    private var registry: [String: Source] = [:]

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
     Returns the `Source` object associated with the given `id` from this module's registry.
     - Parameter id: The source's `nativeId`.
     - Returns: The associated `Source` object or `nil` if there's none.
     */
    @objc func retrieve(_ nativeId: String) -> Source? {
        registry[nativeId]
    }

    /**
     Create a new `Source` instance for a given `nativeId` if none exists yet.
     - Parameter config: Source config object sent from JS.
     */
    @objc(initWithConfig:config:)
    func initWithConfig(_ nativeId: String, config: Any?) {
        bridge.uiManager.addUIBlock { [weak self] _, _ in
            guard
                self?.registry[nativeId] == nil,
                let sourceConfig = RCTConvert.sourceConfig(config)
            else {
                return
            }
            self?.registry[nativeId] = SourceFactory.create(from: sourceConfig)
        }
    }

    /**
     Create a new `Source` instance for a given `nativeId` if none exists yet using an existing DRM object to initialize the `drmConfig` property.
     - Parameter drmNativeId: Id of DRM object.
     - Parameter config: Source config object sent from JS.
     */
    @objc(initWithDRMConfig:drmNativeId:config:)
    func initWithDRMConfig(_ nativeId: String, drmNativeId: String, config: Any?) {
        bridge.uiManager.addUIBlock { [weak self] _, _ in
            guard
                self?.registry[nativeId] == nil,
                let fairplayConfig = self?.getDRMModule()?.retrieve(drmNativeId),
                let sourceConfig = RCTConvert.sourceConfig(config, drmConfig: fairplayConfig)
            else {
                return
            }
            self?.registry[nativeId] = SourceFactory.create(from: sourceConfig)
        }
    }

    /// Fetches the initialized `DRMModule` instance on RN's bridge object.
    private func getDRMModule() -> DRMModule? {
        bridge.module(for: DRMModule.self) as? DRMModule
    }

    /**
     Whether `nativeId` source is currently attached to a player instance.
     - Parameter nativeId: Source `nativeId`.
     - Parameter resolver: JS promise resolver.
     - Parameter rejecter: JS promise rejecter.
     */
    @objc(isAttachedToPlayer:resolver:rejecter:)
    func isAttachedToPlayer(
        _ nativeId: String,
        resolver resolve: @escaping RCTPromiseResolveBlock,
        rejecter reject: @escaping RCTPromiseRejectBlock
    ) {
        bridge.uiManager.addUIBlock { [weak self] _, _ in
            resolve(self?.registry[nativeId]?.isAttachedToPlayer)
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
        _ nativeId: String,
        resolver resolve: @escaping RCTPromiseResolveBlock,
        rejecter reject: @escaping RCTPromiseRejectBlock
    ) {
        bridge.uiManager.addUIBlock { [weak self] _, _ in
            resolve(self?.registry[nativeId]?.isActive)
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
        _ nativeId: String,
        resolver resolve: @escaping RCTPromiseResolveBlock,
        rejecter reject: @escaping RCTPromiseRejectBlock
    ) {
        bridge.uiManager.addUIBlock { [weak self] _, _ in
            resolve(self?.registry[nativeId]?.duration)
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
        _ nativeId: String,
        resolver resolve: @escaping RCTPromiseResolveBlock,
        rejecter reject: @escaping RCTPromiseRejectBlock
    ) {
        bridge.uiManager.addUIBlock { [weak self] _, _ in
            resolve(self?.registry[nativeId]?.loadingState)
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
        _ nativeId: String,
        resolver resolve: @escaping RCTPromiseResolveBlock,
        rejecter reject: @escaping RCTPromiseRejectBlock
    ) {
        bridge.uiManager.addUIBlock { [weak self] _, _ in
            resolve(self?.registry[nativeId]?.metadata)
        }
    }

    /**
     Set the metadata for a loaded `nativeId` source.
     - Parameter nativeId: Source `nativeId`.
     - Parameter resolver: JS promise resolver.
     - Parameter rejecter: JS promise rejecter.
     */
    @objc(setMetadata:metadata:)
    func setMetadata(_ nativeId: String, metadata: Any?) {
        bridge.uiManager.addUIBlock { [weak self] _, _ in
            guard let metadata = metadata as? [String: AnyObject] else {
                return
            }
            self?.registry[nativeId]?.metadata = metadata
        }
    }
}
