import BitmovinPlayer

@objc(DRMModule)
class DRMModule: NSObject, RCTBridgeModule {
    /// React bridge reference.
    @objc var bridge: RCTBridge!

    /// Mapping between UUID values and `FairplayConfig` objects.
    private var registry: [String: FairplayConfig] = [:]

    /// JS module name.
    static func moduleName() -> String! {
        "DRMModule"
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
     Returns the `FairplayConfig` object associated with the given `id` from this module's registry.
     - Parameter id: The config's `nativeId`.
     - Returns: The associated `FairplayConfig` object or `nil`.
     */
    @objc func retrieve(_ nativeId: String) -> FairplayConfig? {
        registry[nativeId]
    }

    /**
     Create a new `FairplayConfig` instance for a given `nativeId` if none exists yet.
     - Parameter config: FairPlay config object sent from JS.
     */
    @objc(initWithConfig:config:)
    func initWithConfig(_ nativeId: String, config: Any?) {
        bridge.uiManager.addUIBlock { [weak self] _, _ in
            guard
                self?.registry[nativeId] == nil,
                let fairplayConfig = RCTConvert.fairplayConfig(config)
            else {
                return
            }
            self?.registry[nativeId] = fairplayConfig
        }
    }
}
