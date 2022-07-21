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
     Creates a new `FairplayConfig` instance inside the internal registry using the provided `config` object.
     - Parameter nativeId: ID to associate with the `FairplayConfig` instance.
     - Returns: The associated `FairplayConfig` instance or `nil`.
     */
    @objc func retrieve(_ nativeId: String) -> FairplayConfig? {
        registry[nativeId]
    }

    /**
     Creates a new `FairplayConfig` instance inside the internal registry using the provided `config` object.
     - Parameter nativeId: ID to associate with the `FairplayConfig` instance.
     - Parameter config: `DRMConfig` object received from JS.
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
            self?.initConfigBlocks(nativeId, config)
        }
    }

    /**
     Removes the `FairplayConfig` instance associated with `nativeId` from `registry` and all data produced during preparation hooks.
     - Parameter nativeId Instance to be disposed.
     */
    @objc(destroy:)
    func destroy(_ nativeId: String) {
        // Remove FairplayConfig instance from registry
        registry.removeValue(forKey: nativeId)
        // Remove any value that might be produced by DRM hooks
        preparedCertificates.removeValue(forKey: nativeId)
        preparedMessages.removeValue(forKey: nativeId)
        preparedSyncMessages.removeValue(forKey: nativeId)
        preparedLicenses.removeValue(forKey: nativeId)
        preparedLicenseServerUrls.removeValue(forKey: nativeId)
        preparedContentIds.removeValue(forKey: nativeId)
        providedLicenseData.removeValue(forKey: nativeId)
    }

    // MARK: - Config blocks.

    /// Mapping between an object's `nativeId` and the value that'll be returned by its `prepareCertificate` callback.
    var preparedCertificates: [String: String] = [:]
    /// Mapping between an object's `nativeId` and the value that'll be returned by its `prepareMessage` callback.
    var preparedMessages: [String: String] = [:]
    /// Mapping between an object's `nativeId` and the value that'll be returned by its `prepareMessage` callback.
    var preparedSyncMessages: [String: String] = [:]
    /// Mapping between an object's `nativeId` and the value that'll be returned by its `prepareLicense` callback.
    var preparedLicenses: [String: String] = [:]
    /// Mapping between an object's `nativeId` and the value that'll be returned by its `prepareLicenseServerUrl` callback.
    var preparedLicenseServerUrls: [String: String] = [:]
    /// Mapping between an object's `nativeId` and the value that'll be returned by its `prepareContentId` callback.
    var preparedContentIds: [String: String] = [:]
    /// Mapping between an object's `nativeId` and the value that'll be returned by its `provideLicenseData` callback.
    var providedLicenseData: [String: String] = [:]

    /**
     Function called from JS to store the computed `prepareCertificate` return value for `nativeId`.

     Note this function is **synchronous** and **blocks** the JS thread. It's important that it stays this way, otherwise we wouldn't be able to return
     the computed JS message from inside the `fairplayConfig.prepareCertificate` Swift closure.
     
     Also, since RN has some limitations regarding the definition of sync JS methods from Swift, it's ncecessary to add a return type and a return
     value (even if it's a void method like in this case) or a crash happens. So the type `Any?` and return value `nil` were used here (it could be any value).
     */
    @objc(setPreparedCertificate:certificate:)
    func setPreparedCertificate(_ nativeId: String, certificate: String) -> Any? {
        preparedCertificates[nativeId] = certificate
        return nil
    }

    /**
     Function called from JS to store the computed `prepareMessage` return value for `nativeId`.

     Note this function is **synchronous** and **blocks** the JS thread. It's important that it stays this way, otherwise we wouldn't be able to return
     the computed JS message from inside the `fairplayConfig.prepareMessage` Swift closure.
     
     Also, since RN has some limitations regarding the definition of sync JS methods from Swift, it's ncecessary to add a return type and a return
     value (even if it's a void method like in this case) or a crash happens. So the type `Any?` and return value `nil` were used here (it could be any value).
     */
    @objc(setPreparedMessage:message:)
    func setPreparedMessage(_ nativeId: String, message: String) -> Any? {
        preparedMessages[nativeId] = message
        return nil
    }

    /**
     Function called from JS to store the computed `prepareSyncMessage` return value for `nativeId`.

     Note this function is **synchronous** and **blocks** the JS thread. It's important that it stays this way, otherwise we wouldn't be able to return
     the computed JS message from inside the `fairplayConfig.prepareSyncMessage` Swift closure.
     
     Also, since RN has some limitations regarding the definition of sync JS methods from Swift, it's ncecessary to add a return type and a return
     value (even if it's a void method like in this case) or a crash happens. So the type `Any?` and return value `nil` were used here (it could be any value).
     */
    @objc(setPreparedSyncMessage:syncMessage:)
    func setPreparedSyncMessage(_ nativeId: String, syncMessage: String) -> Any? {
        preparedSyncMessages[nativeId] = syncMessage
        return nil
    }
    
    /**
     Function called from JS to store the computed `prepareLicense` return value for `nativeId`.

     Note this function is **synchronous** and **blocks** the JS thread. It's important that it stays this way, otherwise we wouldn't be able to return
     the computed JS message from inside the `fairplayConfig.prepareLicense` Swift closure.
     
     Also, since RN has some limitations regarding the definition of sync JS methods from Swift, it's ncecessary to add a return type and a return value
     (even if it's a void method like in this case) or a crash happens. So the type `Any?` and return value `nil` were used here (it could be any value).
     */
    @objc(setPreparedLicense:license:)
    func setPreparedLicense(_ nativeId: String, license: String) -> Any? {
        preparedLicenses[nativeId] = license
        return nil
    }

    /**
     Function called from JS to store the computed `prepareLicenseServerUrl` return value for `nativeId`.

     Note this function is **synchronous** and **blocks** the JS thread. It's important that it stays this way, otherwise we wouldn't be able to return
     the computed JS message from inside the `fairplayConfig.prepareLicenseServerUrl` Swift closure.
     
     Also, since RN has some limitations regarding the definition of sync JS methods from Swift, it's ncecessary to add a return type and a return value
     (even if it's a void method like in this case) or a crash happens. So the type `Any?` and return value `nil` were used here (it could be any value).
     */
    @objc(setPreparedLicenseServerUrl:url:)
    func setPreparedLicenseServerUrl(_ nativeId: String, url: String) -> Any? {
        preparedLicenseServerUrls[nativeId] = url
        return nil
    }

    /**
     Function called from JS to store the computed `prepareContentId` return value for `nativeId`.

     Note this function is **synchronous** and **blocks** the JS thread. It's important that it stays this way, otherwise we wouldn't be able to return
     the computed JS message from inside the `fairplayConfig.prepareContentId` Swift closure.
     
     Also, since RN has some limitations regarding the definition of sync JS methods from Swift, it's ncecessary to add a return type and a return value
     (even if it's a void method like in this case) or a crash happens. So the type `Any?` and return value `nil` were used here (it could be any value).
     */
    @objc(setPreparedContentId:contentId:)
    func setPreparedContentId(_ nativeId: String, contentId: String) -> Any? {
        preparedContentIds[nativeId] = contentId
        return nil
    }

    /**
     Function called from JS to store the computed `provideLicenseData` return value for `nativeId`.

     Note this function is **synchronous** and **blocks** the JS thread. It's important that it stays this way, otherwise we wouldn't be able to return
     the computed JS message from inside the `fairplayConfig.provideLicenseData` Swift closure.
     
     Also, since RN has some limitations regarding the definition of sync JS methods from Swift, it's ncecessary to add a return type and a return value
     (even if it's a void method like in this case) or a crash happens. So the type `Any?` and return value `nil` were used here (it could be any value).
     */
    @objc(setProvidedLicenseData:licenseData:)
    func setProvidedLicenseData(_ nativeId: String, licenseData: String?) -> Any? {
        providedLicenseData[nativeId] = licenseData
        return nil
    }

    /**
     Initialize all configuration blocks in `FairplayConfig` applying the designated JS functions according to it's JS instance config.

     - Parameter nativeId: Instance nativeId.
     - Parameter config: FairPlay config object sent from JS.
     */
    private func initConfigBlocks(_ nativeId: String, _ config: Any?) {
        if let config = config as? [String: Any] {
            initPrepareCertificate(nativeId, config: config)
            initPrepareMessage(nativeId, config: config)
            initPrepareSyncMessage(nativeId, config: config)
            initPrepareLicense(nativeId, config: config)
            initPrepareLicenseServerUrl(nativeId, config: config)
            initPrepareContentId(nativeId, config: config)
            initProvideLicenseData(nativeId, config: config)
            initPersistLicenseData(nativeId, config: config)
        }
    }
    
    /**
     Initialize the `prepareCertificate` block in the `FairplayConfig` associated with `nativeId`.

     - Parameter nativeId - Instance nativeId.
     - Parameter config: FairPlay config object sent from JS.
     */
    private func initPrepareCertificate(_ nativeId: String, config: [String: Any]) {
        guard let fairplayConfig = registry[nativeId] else {
            return
        }
        if let fairplay = config["fairplay"] as? [String: Any], fairplay["prepareCertificate"] != nil {
            fairplayConfig.prepareCertificate = { [weak self] data in
                self?.prepareCertificateFromJS(nativeId, data) ?? data
            }
        } else {
            // Use default callback when `prepareCertificate` isn't set in configuration.
            fairplayConfig.prepareCertificate = { data in data }
        }
    }

    /**
     Initialize the `prepareMessage` block in the `FairplayConfig` associated with `nativeId`.

     - Parameter nativeId - Instance nativeId.
     - Parameter config: FairPlay config object sent from JS.
     */
    private func initPrepareMessage(_ nativeId: String, config: [String: Any]) {
        guard let fairplayConfig = registry[nativeId] else {
            return
        }
        if config["prepareMessage"] != nil {
            fairplayConfig.prepareMessage = { [weak self] spcData, assetId in
                self?.prepareMessageFromJS(nativeId, spcData, assetId) ?? spcData
            }
        } else {
            // Use default callback when `prepareMessage` isn't set in configuration.
            fairplayConfig.prepareMessage = { spcData, _ in spcData }
        }
    }

    /**
     Initialize the `prepareSyncMessage` block in the `FairplayConfig` associated with `nativeId`.

     - Parameter nativeId - Instance nativeId.
     - Parameter config: FairPlay config object sent from JS.
     */
    private func initPrepareSyncMessage(_ nativeId: String, config: [String: Any]) {
        guard let fairplayConfig = registry[nativeId] else {
            return
        }
        if let fairplay = config["fairplay"] as? [String: Any], fairplay["prepareSyncMessage"] != nil {
            fairplayConfig.prepareSyncMessage = { [weak self] syncSpcData, assetId in
                self?.prepareSyncMessageFromJS(nativeId, syncSpcData, assetId) ?? syncSpcData
            }
        }
    }

    /**
     Initialize the `prepareLicense` block in the `FairplayConfig` associated with `nativeId`.

     - Parameter nativeId - Instance nativeId.
     - Parameter config: FairPlay config object sent from JS.
     */
    private func initPrepareLicense(_ nativeId: String, config: [String: Any]) {
        guard let fairplayConfig = registry[nativeId] else {
            return
        }
        if config["prepareLicense"] != nil {
            fairplayConfig.prepareLicense = { [weak self] data in
                self?.prepareLicenseFromJS(nativeId, data) ?? data
            }
        }
    }

    /**
     Initialize the `prepareLicenseServerUrl` block in the `FairplayConfig` associated with `nativeId`.

     - Parameter nativeId - Instance nativeId.
     - Parameter config: FairPlay config object sent from JS.
     */
    private func initPrepareLicenseServerUrl(_ nativeId: String, config: [String: Any]) {
        guard let fairplayConfig = registry[nativeId] else {
            return
        }
        if let fairplay = config["fairplay"] as? [String: Any], fairplay["prepareLicenseServerUrl"] != nil {
            fairplayConfig.prepareLicenseServerUrl = { [weak self] url in
                self?.prepareLicenseServerUrlFromJS(nativeId, url) ?? url
            }
        }
    }
    
    /**
     Initialize the `prepareContentId` block in the `FairplayConfig` associated with `nativeId`.

     - Parameter nativeId - Instance nativeId.
     - Parameter config: FairPlay config object sent from JS.
     */
    private func initPrepareContentId(_ nativeId: String, config: [String: Any]) {
        guard let fairplayConfig = registry[nativeId] else {
            return
        }
        if let fairplay = config["fairplay"] as? [String: Any], fairplay["prepareContentId"] != nil {
            fairplayConfig.prepareContentId = { [weak self] contentId in
                self?.prepareContentIdFromJS(nativeId, contentId) ?? contentId
            }
        }
    }

    /**
     Initialize the `provideLicenseData` block in the `FairplayConfig` associated with `nativeId`.

     - Parameter nativeId - Instance nativeId.
     - Parameter config: FairPlay config object sent from JS.
     */
    private func initProvideLicenseData(_ nativeId: String, config: [String: Any]) {
        guard let fairplayConfig = registry[nativeId] else {
            return
        }
        if let fairplay = config["fairplay"] as? [String: Any], fairplay["provideLicenseData"] != nil {
            fairplayConfig.provideLicenseData = { [weak self] assetId in
                self?.provideLicenseDataFromJS(nativeId, assetId)
            }
        }
    }

    /**
     Initialize the `persistLicenseData` block in the `FairplayConfig` associated with `nativeId`.

     - Parameter nativeId - Instance nativeId.
     - Parameter config: FairPlay config object sent from JS.
     */
    private func initPersistLicenseData(_ nativeId: String, config: [String: Any]) {
        guard let fairplayConfig = registry[nativeId] else {
            return
        }
        if let fairplay = config["fairplay"] as? [String: Any], fairplay["persistLicenseData"] != nil {
            fairplayConfig.persistLicenseData = { [weak self] assetId, licenseData in
                self?.persistLicenseDataFromJS(nativeId, assetId, licenseData)
            }
        }
    }

    /**
     Defines the body of a `prepareCertificate` block in `FairplayConfig`.
     Used to sync Native->JS and JS->Native calls during `prepareCertificate` execution.

     - Parameter nativeId: Instance nativeId.
     - Parameter data: Certificate data received from `prepareCertificate`.
     - Returns: JS prepared certificate value.
     */
    private func prepareCertificateFromJS(_ nativeId: String, _ data: Data) -> Data {
        // Setup dispatch group
        let dispatchGroup = DispatchGroup()
        dispatchGroup.enter()
        // Enqueue `onPrepareCertificate` method to be executed on the JS DRM object and in the JS thread.
        bridge.enqueueJSCall("DRM-\(nativeId)", method: "onPrepareCertificate", args: [data.base64EncodedString()]) {
            // Leave dispatch group when call to JS object finishes.
            dispatchGroup.leave()
        }
        // Wait for JS `onPrepareCertificate` to finish its execution.
        dispatchGroup.wait()
        // Return value stored by `onPrepareCertificate`.
        return Data(base64Encoded: preparedCertificates[nativeId] ?? "") ?? data
    }

    /**
     Defines the body of a `prepareMessage` block in `FairplayConfig`.
     Used to sync Native->JS and JS->Native calls during `prepareMessage` execution.

     - Parameter nativeId: Instance nativeId.
     - Parameter data: SPC data received from `prepareMessage`.
     - Parameter assetID: Asset ID value received from `prepareMessage`.
     - Returns: JS prepared message value.
     */
    private func prepareMessageFromJS(_ nativeId: String, _ data: Data, _ assetId: String) -> Data {
        // Setup dispatch group
        let dispatchGroup = DispatchGroup()
        dispatchGroup.enter()
        // Enqueue `onPrepareMessage` method to be executed on the JS DRM object and in the JS thread.
        bridge.enqueueJSCall(
            "DRM-\(nativeId)",
            method: "onPrepareMessage",
            args: [data.base64EncodedString(), assetId]
        ) {
            // Leave dispatch group when call to JS object finishes.
            dispatchGroup.leave()
        }
        // Wait for JS `onPrepareMessage` to finish its execution.
        dispatchGroup.wait()
        // Return value stored by `onPrepareMessage`.
        return Data(base64Encoded: preparedMessages[nativeId] ?? "") ?? data
    }

    /**
     Defines the body of a `prepareSyncMessage` block in `FairplayConfig`.
     Used to sync Native->JS and JS->Native calls during `prepareSyncMessage` execution.

     - Parameter nativeId: Instance nativeId.
     - Parameter data: Sync SPC data received from `prepareSyncMessage`.
     - Parameter assetID: Asset ID value received from `prepareSyncMessage`.
     - Returns: JS prepared sync message value.
     */
    private func prepareSyncMessageFromJS(_ nativeId: String, _ data: Data, _ assetId: String) -> Data {
        // Setup dispatch group
        let dispatchGroup = DispatchGroup()
        dispatchGroup.enter()
        // Enqueue `onPrepareMessage` method to be executed on the JS DRM object and in the JS thread.
        bridge.enqueueJSCall(
            "DRM-\(nativeId)",
            method: "onPrepareSyncMessage",
            args: [data.base64EncodedString(), assetId]
        ) {
            // Leave dispatch group when call to JS object finishes.
            dispatchGroup.leave()
        }
        // Wait for JS `onPrepareMessage` to finish its execution.
        dispatchGroup.wait()
        // Return value stored by `onPrepareMessage`.
        return Data(base64Encoded: preparedSyncMessages[nativeId] ?? "") ?? data
    }

    /**
     Defines the body of a `prepareLicense` block in `FairplayConfig`.
     Used to sync Native->JS and JS->Native calls during `prepareLicense` execution.

     - Parameter nativeId: Instance nativeId.
     - Parameter data: License data received from `prepareLicense`.
     - Returns: JS prepared license value.
     */
    private func prepareLicenseFromJS(_ nativeId: String, _ data: Data) -> Data {
        // Setup dispatch group
        let dispatchGroup = DispatchGroup()
        dispatchGroup.enter()
        // Enqueue `onPrepareLicense` method to be executed on the JS DRM object and in the JS thread.
        bridge.enqueueJSCall("DRM-\(nativeId)", method: "onPrepareLicense", args: [data.base64EncodedString()]) {
            // Leave dispatch group when call to JS object finishes.
            dispatchGroup.leave()
        }
        // Wait for JS `onPrepareLicense` to finish its execution.
        dispatchGroup.wait()
        // Return value stored by `onPrepareLicense`.
        return Data(base64Encoded: preparedLicenses[nativeId] ?? "") ?? data
    }

    /**
     Defines the body of a `prepareLicenseServerUrl` block in `FairplayConfig`.
     Used to sync Native->JS and JS->Native calls during `prepareLicenseServerUrl` execution.

     - Parameter nativeId: Instance nativeId.
     - Parameter url: License server url string received from `prepareLicenseServerUrl`.
     - Returns: JS prepared license server url value.
     */
    private func prepareLicenseServerUrlFromJS(_ nativeId: String, _ url: String) -> String {
        // Setup dispatch group
        let dispatchGroup = DispatchGroup()
        dispatchGroup.enter()
        // Enqueue `onPrepareLicenseServerUrl` method to be executed on the JS DRM object and in the JS thread.
        bridge.enqueueJSCall("DRM-\(nativeId)", method: "onPrepareLicenseServerUrl", args: [url]) {
            // Leave dispatch group when call to JS object finishes.
            dispatchGroup.leave()
        }
        // Wait for JS `onPrepareLicenseServerUrl` to finish its execution.
        dispatchGroup.wait()
        // Return value stored by `onPrepareLicenseServerUrl`.
        return preparedLicenseServerUrls[nativeId] ?? url
    }

    /**
     Defines the body of a `prepareContentId` block in `FairplayConfig`.
     Used to sync Native->JS and JS->Native calls during `prepareContentId` execution.

     - Parameter nativeId: Instance nativeId.
     - Parameter contentId: The extracted contentId received from `prepareContentId`.
     - Returns: JS prepared contentId.
     */
    private func prepareContentIdFromJS(_ nativeId: String, _ contentId: String) -> String {
        // Setup dispatch group
        let dispatchGroup = DispatchGroup()
        dispatchGroup.enter()
        // Enqueue `onPrepareContentId` method to be executed on the JS DRM object and in the JS thread.
        bridge.enqueueJSCall("DRM-\(nativeId)", method: "onPrepareContentId", args: [contentId]) {
            // Leave dispatch group when call to JS object finishes.
            dispatchGroup.leave()
        }
        // Wait for JS `onPrepareContentId` to finish its execution.
        dispatchGroup.wait()
        // Return value stored by `onPrepareContentId`.
        return preparedContentIds[nativeId] ?? contentId
    }

    /**
     Defines the body of a `provideLicenseData` block in `FairplayConfig`.
     Used to sync Native->JS and JS->Native calls during `provideLicenseData` execution.

     - Parameter nativeId: Instance nativeId.
     - Parameter contentId: The extracted contentId received from `provideLicenseData`.
     - Returns: JS provided license data.
     */
    private func provideLicenseDataFromJS(_ nativeId: String, _ assetId: String) -> Data? {
        // Setup dispatch group
        let dispatchGroup = DispatchGroup()
        dispatchGroup.enter()
        // Enqueue `onPrepareLicenseData` method to be executed on the JS DRM object and in the JS thread.
        bridge.enqueueJSCall("DRM-\(nativeId)", method: "onProvideLicenseData", args: [assetId]) {
            // Leave dispatch group when call to JS object finishes.
            dispatchGroup.leave()
        }
        // Wait for JS `onPrepareLicenseData` to finish its execution.
        dispatchGroup.wait()
        // Return value stored by `onPrepareLicenseData`.
        return Data(base64Encoded: providedLicenseData[nativeId] ?? "")
    }

    /**
     Defines the body of a `persistLicenseData` block in `FairplayConfig`.
     Used to dispatch the execution of `persistLicenseData` to the JS thread.

     - Parameter nativeId: Instance nativeId.
     - Parameter assetId: The `assetId` provided `persistLicenseData` callback.
     - Parameter licenseData: The license data provided by `persistLicenseData` callback.
     */
    private func persistLicenseDataFromJS(_ nativeId: String, _ assetId: String, _ licenseData: Data) {
        // Enqueue `onPersistLicenseData` method to be executed on the JS DRM object and in the JS thread.
        bridge.enqueueJSCall(
            "DRM-\(nativeId)",
            method: "onPersistLicenseData",
            args: [assetId, licenseData.base64EncodedString()],
            completion: nil
        )
    }
}
