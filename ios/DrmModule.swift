import BitmovinPlayer

@objc(DrmModule)
class DrmModule: NSObject, RCTBridgeModule {
    /// React bridge reference.
    @objc var bridge: RCTBridge!

    /// In-memory mapping from `nativeId`s to `FairplayConfig` instances.
    private var drmConfigs: Registry<FairplayConfig> = [:]

    /// JS module name.
    static func moduleName() -> String! {
        "DrmModule"
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
     Creates a new `FairplayConfig` instance inside the internal drmConfigs using the provided `config` object.
     - Parameter nativeId: ID to associate with the `FairplayConfig` instance.
     - Returns: The associated `FairplayConfig` instance or `nil`.
     */
    @objc func retrieve(_ nativeId: NativeId) -> FairplayConfig? {
        drmConfigs[nativeId]
    }

    /**
     Creates a new `FairplayConfig` instance inside the internal drmConfigs using the provided `config` object.
     - Parameter nativeId: ID to associate with the `FairplayConfig` instance.
     - Parameter config: `DrmConfig` object received from JS.
     */
    @objc(initWithConfig:config:)
    func initWithConfig(_ nativeId: NativeId, config: Any?) {
        bridge.uiManager.addUIBlock { [weak self] _, _ in
            guard
                self?.drmConfigs[nativeId] == nil,
                let fairplayConfig = RCTConvert.fairplayConfig(config)
            else {
                return
            }
            self?.drmConfigs[nativeId] = fairplayConfig
            self?.initConfigBlocks(nativeId, config)
        }
    }

    /**
     Removes the `FairplayConfig` instance associated with `nativeId` from `drmConfigs` and all data produced during preparation hooks.
     - Parameter nativeId Instance to be disposed.
     */
    @objc(destroy:)
    func destroy(_ nativeId: NativeId) {
        // Remove FairplayConfig instance from drmConfigs
        drmConfigs.removeValue(forKey: nativeId)
        // Remove any value that might be produced by DRM hooks
        preparedCertificates.removeValue(forKey: nativeId)
        preparedMessages.removeValue(forKey: nativeId)
        preparedSyncMessages.removeValue(forKey: nativeId)
        preparedLicenses.removeValue(forKey: nativeId)
        preparedLicenseServerUrls.removeValue(forKey: nativeId)
        preparedContentIds.removeValue(forKey: nativeId)
    }

    // MARK: - Config blocks.

    /// Mapping between an object's `nativeId` and the value that'll be returned by its `prepareCertificate` callback.
    var preparedCertificates: Registry<String> = [:]
    /// Mapping between an object's `nativeId` and the value that'll be returned by its `prepareMessage` callback.
    var preparedMessages: Registry<String> = [:]
    /// Mapping between an object's `nativeId` and the value that'll be returned by its `prepareMessage` callback.
    var preparedSyncMessages: Registry<String> = [:]
    /// Mapping between an object's `nativeId` and the value that'll be returned by its `prepareLicense` callback.
    var preparedLicenses: Registry<String> = [:]
    /// Mapping between an object's `nativeId` and the value that'll be returned by its `prepareLicenseServerUrl` callback.
    var preparedLicenseServerUrls: Registry<String> = [:]
    /// Mapping between an object's `nativeId` and the value that'll be returned by its `prepareContentId` callback.
    var preparedContentIds: Registry<String> = [:]

    /**
     Function called from JS to store the computed `prepareCertificate` return value for `nativeId`.

     Note this function is **synchronous** and **blocks** the JS thread. It's important that it stays this way, otherwise we wouldn't be able to return
     the computed JS message from inside the `fairplayConfig.prepareCertificate` Swift closure.
     
     Also, since RN has some limitations regarding the definition of sync JS methods from Swift, it's necessary to add a return type and a return
     value (even if it's a void method like in this case) or a crash happens. So the type `Any?` and return value `nil` were used here (it could be any value).
     */
    @objc(setPreparedCertificate:certificate:)
    func setPreparedCertificate(_ nativeId: NativeId, certificate: String) -> Any? {
        preparedCertificates[nativeId] = certificate
        return nil
    }

    /**
     Function called from JS to store the computed `prepareMessage` return value for `nativeId`.

     Note this function is **synchronous** and **blocks** the JS thread. It's important that it stays this way, otherwise we wouldn't be able to return
     the computed JS message from inside the `fairplayConfig.prepareMessage` Swift closure.
     
     Also, since RN has some limitations regarding the definition of sync JS methods from Swift, it's necessary to add a return type and a return
     value (even if it's a void method like in this case) or a crash happens. So the type `Any?` and return value `nil` were used here (it could be any value).
     */
    @objc(setPreparedMessage:message:)
    func setPreparedMessage(_ nativeId: NativeId, message: String) -> Any? {
        preparedMessages[nativeId] = message
        return nil
    }

    /**
     Function called from JS to store the computed `prepareSyncMessage` return value for `nativeId`.

     Note this function is **synchronous** and **blocks** the JS thread. It's important that it stays this way, otherwise we wouldn't be able to return
     the computed JS message from inside the `fairplayConfig.prepareSyncMessage` Swift closure.
     
     Also, since RN has some limitations regarding the definition of sync JS methods from Swift, it's necessary to add a return type and a return
     value (even if it's a void method like in this case) or a crash happens. So the type `Any?` and return value `nil` were used here (it could be any value).
     */
    @objc(setPreparedSyncMessage:syncMessage:)
    func setPreparedSyncMessage(_ nativeId: NativeId, syncMessage: String) -> Any? {
        preparedSyncMessages[nativeId] = syncMessage
        return nil
    }
    
    /**
     Function called from JS to store the computed `prepareLicense` return value for `nativeId`.

     Note this function is **synchronous** and **blocks** the JS thread. It's important that it stays this way, otherwise we wouldn't be able to return
     the computed JS message from inside the `fairplayConfig.prepareLicense` Swift closure.
     
     Also, since RN has some limitations regarding the definition of sync JS methods from Swift, it's necessary to add a return type and a return value
     (even if it's a void method like in this case) or a crash happens. So the type `Any?` and return value `nil` were used here (it could be any value).
     */
    @objc(setPreparedLicense:license:)
    func setPreparedLicense(_ nativeId: NativeId, license: String) -> Any? {
        preparedLicenses[nativeId] = license
        return nil
    }

    /**
     Function called from JS to store the computed `prepareLicenseServerUrl` return value for `nativeId`.

     Note this function is **synchronous** and **blocks** the JS thread. It's important that it stays this way, otherwise we wouldn't be able to return
     the computed JS message from inside the `fairplayConfig.prepareLicenseServerUrl` Swift closure.
     
     Also, since RN has some limitations regarding the definition of sync JS methods from Swift, it's necessary to add a return type and a return value
     (even if it's a void method like in this case) or a crash happens. So the type `Any?` and return value `nil` were used here (it could be any value).
     */
    @objc(setPreparedLicenseServerUrl:url:)
    func setPreparedLicenseServerUrl(_ nativeId: NativeId, url: String) -> Any? {
        preparedLicenseServerUrls[nativeId] = url
        return nil
    }

    /**
     Function called from JS to store the computed `prepareContentId` return value for `nativeId`.

     Note this function is **synchronous** and **blocks** the JS thread. It's important that it stays this way, otherwise we wouldn't be able to return
     the computed JS message from inside the `fairplayConfig.prepareContentId` Swift closure.
     
     Also, since RN has some limitations regarding the definition of sync JS methods from Swift, it's necessary to add a return type and a return value
     (even if it's a void method like in this case) or a crash happens. So the type `Any?` and return value `nil` were used here (it could be any value).
     */
    @objc(setPreparedContentId:contentId:)
    func setPreparedContentId(_ nativeId: NativeId, contentId: String) -> Any? {
        preparedContentIds[nativeId] = contentId
        return nil
    }

    /**
     Initialize all configuration blocks in `FairplayConfig` applying the designated JS functions according to it's JS instance config.

     - Parameter nativeId: Instance nativeId.
     - Parameter config: FairPlay config object sent from JS.
     */
    private func initConfigBlocks(_ nativeId: NativeId, _ config: Any?) {
        if let json = config as? [String: Any], let fairplayJson = json["fairplay"] as? [String: Any] {
            initPrepareCertificate(nativeId, fairplayJson: fairplayJson)
            initPrepareMessage(nativeId, fairplayJson: fairplayJson)
            initPrepareSyncMessage(nativeId, fairplayJson: fairplayJson)
            initPrepareLicense(nativeId, fairplayJson: fairplayJson)
            initPrepareLicenseServerUrl(nativeId, fairplayJson: fairplayJson)
            initPrepareContentId(nativeId, fairplayJson: fairplayJson)
        }
    }
    
    /**
     Initialize the `prepareCertificate` block in the `FairplayConfig` associated with `nativeId`.

     - Parameter nativeId - Instance nativeId.
     - Parameter config: FairPlay config object sent from JS.
     */
    private func initPrepareCertificate(_ nativeId: NativeId, fairplayJson: [String: Any]) {
        guard let fairplayConfig = drmConfigs[nativeId] else {
            return
        }
        if fairplayJson["prepareCertificate"] != nil {
            fairplayConfig.prepareCertificate = { [weak self] data in
                self?.prepareCertificateFromJS(nativeId, data) ?? data
            }
        }
    }

    /**
     Initialize the `prepareMessage` block in the `FairplayConfig` associated with `nativeId`.

     - Parameter nativeId - Instance nativeId.
     - Parameter config: FairPlay config object sent from JS.
     */
    private func initPrepareMessage(_ nativeId: NativeId, fairplayJson: [String: Any]) {
        guard let fairplayConfig = drmConfigs[nativeId] else {
            return
        }
        if fairplayJson["prepareMessage"] != nil {
            fairplayConfig.prepareMessage = { [weak self] spcData, assetId in
                self?.prepareMessageFromJS(nativeId, spcData, assetId) ?? spcData
            }
        }
    }

    /**
     Initialize the `prepareSyncMessage` block in the `FairplayConfig` associated with `nativeId`.

     - Parameter nativeId - Instance nativeId.
     - Parameter config: FairPlay config object sent from JS.
     */
    private func initPrepareSyncMessage(_ nativeId: NativeId, fairplayJson: [String: Any]) {
        guard let fairplayConfig = drmConfigs[nativeId] else {
            return
        }
        if fairplayJson["prepareSyncMessage"] != nil {
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
    private func initPrepareLicense(_ nativeId: NativeId, fairplayJson: [String: Any]) {
        guard let fairplayConfig = drmConfigs[nativeId] else {
            return
        }
        if fairplayJson["prepareLicense"] != nil {
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
    private func initPrepareLicenseServerUrl(_ nativeId: NativeId, fairplayJson: [String: Any]) {
        guard let fairplayConfig = drmConfigs[nativeId] else {
            return
        }
        if fairplayJson["prepareLicenseServerUrl"] != nil {
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
    private func initPrepareContentId(_ nativeId: NativeId, fairplayJson: [String: Any]) {
        guard let fairplayConfig = drmConfigs[nativeId] else {
            return
        }
        if fairplayJson["prepareContentId"] != nil {
            fairplayConfig.prepareContentId = { [weak self] contentId in
                self?.prepareContentIdFromJS(nativeId, contentId) ?? contentId
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
    private func prepareCertificateFromJS(_ nativeId: NativeId, _ data: Data) -> Data {
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
    private func prepareMessageFromJS(_ nativeId: NativeId, _ data: Data, _ assetId: String) -> Data {
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
    private func prepareSyncMessageFromJS(_ nativeId: NativeId, _ data: Data, _ assetId: String) -> Data {
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
    private func prepareLicenseFromJS(_ nativeId: NativeId, _ data: Data) -> Data {
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
    private func prepareLicenseServerUrlFromJS(_ nativeId: NativeId, _ url: String) -> String {
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
    private func prepareContentIdFromJS(_ nativeId: NativeId, _ contentId: String) -> String {
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
}
