import BitmovinPlayer
import ExpoModulesCore

/**
 * Expo module for DRM configuration management with FairPlay DRM support.
 * Handles bidirectional communication for DRM preparation callbacks.
 */
public class DrmExpoModule: Module {
    /// In-memory mapping from `nativeId`s to `FairplayConfig` instances.
    private var drmConfigs: Registry<FairplayConfig> = [:]

    /// Mapping between an object's `nativeId` and the value that'll be returned by its `prepareCertificate` callback.
    var preparedCertificates: Registry<String> = [:]
    /// Mapping between an object's `nativeId` and the value that'll be returned by its `prepareMessage` callback.
    var preparedMessages: Registry<String> = [:]
    /// Mapping between an object's `nativeId` and the value that'll be returned by its `prepareMessage` callback.
    var preparedSyncMessages: Registry<String> = [:]
    /// Mapping between an object's `nativeId` and the value that'll be returned by its `prepareLicense` callback.
    var preparedLicenses: Registry<String> = [:]
    /// Mapping between an object's `nativeId` and the value that'll be returned
    /// by its `prepareLicenseServerUrl` callback.
    var preparedLicenseServerUrls: Registry<String> = [:]
    /// Mapping between an object's `nativeId` and the value that'll be returned by its `prepareContentId` callback.
    var preparedContentIds: Registry<String> = [:]

    public func definition() -> ModuleDefinition {
        Name("DrmExpoModule")

        AsyncFunction("initWithConfig") { (nativeId: String, config: [String: Any]) in
            await withCheckedContinuation { continuation in
                DispatchQueue.main.async { [weak self] in
                    guard
                        self?.drmConfigs[nativeId] == nil,
                        let fairplayConfig = RCTConvert.drmConfig(config).fairplay
                    else {
                        continuation.resume()
                        return
                    }
                    self?.drmConfigs[nativeId] = fairplayConfig
                    self?.initConfigBlocks(nativeId, config)
                    continuation.resume()
                }
            }
        }

        AsyncFunction("destroy") { (nativeId: String) in
            await withCheckedContinuation { continuation in
                DispatchQueue.main.async { [weak self] in
                    // Remove FairplayConfig instance from drmConfigs
                    self?.drmConfigs.removeValue(forKey: nativeId)
                    // Remove any value that might be produced by DRM hooks
                    self?.preparedCertificates.removeValue(forKey: nativeId)
                    self?.preparedMessages.removeValue(forKey: nativeId)
                    self?.preparedSyncMessages.removeValue(forKey: nativeId)
                    self?.preparedLicenses.removeValue(forKey: nativeId)
                    self?.preparedLicenseServerUrls.removeValue(forKey: nativeId)
                    self?.preparedContentIds.removeValue(forKey: nativeId)
                    continuation.resume()
                }
            }
        }

        Function("setPreparedCertificate") { (nativeId: String, certificate: String) -> Any? in
            preparedCertificates[nativeId] = certificate
            return nil
        }

        Function("setPreparedMessage") { (nativeId: String, message: String) -> Any? in
            preparedMessages[nativeId] = message
            return nil
        }

        Function("setPreparedSyncMessage") { (nativeId: String, syncMessage: String) -> Any? in
            preparedSyncMessages[nativeId] = syncMessage
            return nil
        }

        Function("setPreparedLicense") { (nativeId: String, license: String) -> Any? in
            preparedLicenses[nativeId] = license
            return nil
        }

        Function("setPreparedLicenseServerUrl") { (nativeId: String, url: String) -> Any? in
            preparedLicenseServerUrls[nativeId] = url
            return nil
        }

        Function("setPreparedContentId") { (nativeId: String, contentId: String) -> Any? in
            preparedContentIds[nativeId] = contentId
            return nil
        }
    }

    /**
     * Retrieves the FairplayConfig instance for the given nativeId.
     * This method maintains the same static access pattern as the legacy module.
     */
    @objc
    func retrieve(_ nativeId: String) -> FairplayConfig? {
        drmConfigs[nativeId]
    }

    /**
     * Initialize all configuration blocks in `FairplayConfig` applying the designated
     * JS functions according to it's JS instance config.
     *
     * - Parameter nativeId: Instance nativeId.
     * - Parameter config: DRM config object sent from JS.
     */
    private func initConfigBlocks(_ nativeId: String, _ config: [String: Any]) {
        if let fairplayJson = config["fairplay"] as? [String: Any] {
            initPrepareCertificate(nativeId, fairplayJson: fairplayJson)
            initPrepareMessage(nativeId, fairplayJson: fairplayJson)
            initPrepareSyncMessage(nativeId, fairplayJson: fairplayJson)
            initPrepareLicense(nativeId, fairplayJson: fairplayJson)
            initPrepareLicenseServerUrl(nativeId, fairplayJson: fairplayJson)
            initPrepareContentId(nativeId, fairplayJson: fairplayJson)
        }
    }

    /**
     * Initialize the `prepareCertificate` block in the `FairplayConfig` associated with `nativeId`.
     */
    private func initPrepareCertificate(_ nativeId: String, fairplayJson: [String: Any]) {
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
     * Initialize the `prepareMessage` block in the `FairplayConfig` associated with `nativeId`.
     */
    private func initPrepareMessage(_ nativeId: String, fairplayJson: [String: Any]) {
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
     * Initialize the `prepareSyncMessage` block in the `FairplayConfig` associated with `nativeId`.
     */
    private func initPrepareSyncMessage(_ nativeId: String, fairplayJson: [String: Any]) {
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
     * Initialize the `prepareLicense` block in the `FairplayConfig` associated with `nativeId`.
     */
    private func initPrepareLicense(_ nativeId: String, fairplayJson: [String: Any]) {
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
     * Initialize the `prepareLicenseServerUrl` block in the `FairplayConfig` associated with `nativeId`.
     */
    private func initPrepareLicenseServerUrl(_ nativeId: String, fairplayJson: [String: Any]) {
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
     * Initialize the `prepareContentId` block in the `FairplayConfig` associated with `nativeId`.
     */
    private func initPrepareContentId(_ nativeId: String, fairplayJson: [String: Any]) {
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
     * Defines the body of a `prepareCertificate` block in `FairplayConfig`.
     * Used to sync Native->JS and JS->Native calls during `prepareCertificate` execution.
     */
    private func prepareCertificateFromJS(_ nativeId: String, _ data: Data) -> Data {
        // Setup dispatch group
        let dispatchGroup = DispatchGroup()
        dispatchGroup.enter()
        
        // Send event to JavaScript
        sendEvent("onPrepareCertificate", [
            "nativeId": nativeId,
            "certificate": data.base64EncodedString()
        ])
        
        // Wait for JS `onPrepareCertificate` to finish its execution.
        dispatchGroup.wait()
        // Return value stored by `onPrepareCertificate`.
        return Data(base64Encoded: preparedCertificates[nativeId] ?? "") ?? data
    }

    /**
     * Defines the body of a `prepareMessage` block in `FairplayConfig`.
     * Used to sync Native->JS and JS->Native calls during `prepareMessage` execution.
     */
    private func prepareMessageFromJS(_ nativeId: String, _ data: Data, _ assetId: String) -> Data {
        // Setup dispatch group
        let dispatchGroup = DispatchGroup()
        dispatchGroup.enter()
        
        // Send event to JavaScript
        sendEvent("onPrepareMessage", [
            "nativeId": nativeId,
            "message": data.base64EncodedString(),
            "assetId": assetId
        ])
        
        // Wait for JS `onPrepareMessage` to finish its execution.
        dispatchGroup.wait()
        // Return value stored by `onPrepareMessage`.
        return Data(base64Encoded: preparedMessages[nativeId] ?? "") ?? data
    }

    /**
     * Defines the body of a `prepareSyncMessage` block in `FairplayConfig`.
     * Used to sync Native->JS and JS->Native calls during `prepareSyncMessage` execution.
     */
    private func prepareSyncMessageFromJS(_ nativeId: String, _ data: Data, _ assetId: String) -> Data {
        // Setup dispatch group
        let dispatchGroup = DispatchGroup()
        dispatchGroup.enter()
        
        // Send event to JavaScript
        sendEvent("onPrepareSyncMessage", [
            "nativeId": nativeId,
            "syncMessage": data.base64EncodedString(),
            "assetId": assetId
        ])
        
        // Wait for JS `onPrepareSyncMessage` to finish its execution.
        dispatchGroup.wait()
        // Return value stored by `onPrepareSyncMessage`.
        return Data(base64Encoded: preparedSyncMessages[nativeId] ?? "") ?? data
    }

    /**
     * Defines the body of a `prepareLicense` block in `FairplayConfig`.
     * Used to sync Native->JS and JS->Native calls during `prepareLicense` execution.
     */
    private func prepareLicenseFromJS(_ nativeId: String, _ data: Data) -> Data {
        // Setup dispatch group
        let dispatchGroup = DispatchGroup()
        dispatchGroup.enter()
        
        // Send event to JavaScript
        sendEvent("onPrepareLicense", [
            "nativeId": nativeId,
            "license": data.base64EncodedString()
        ])
        
        // Wait for JS `onPrepareLicense` to finish its execution.
        dispatchGroup.wait()
        // Return value stored by `onPrepareLicense`.
        return Data(base64Encoded: preparedLicenses[nativeId] ?? "") ?? data
    }

    /**
     * Defines the body of a `prepareLicenseServerUrl` block in `FairplayConfig`.
     * Used to sync Native->JS and JS->Native calls during `prepareLicenseServerUrl` execution.
     */
    private func prepareLicenseServerUrlFromJS(_ nativeId: String, _ url: String) -> String {
        // Setup dispatch group
        let dispatchGroup = DispatchGroup()
        dispatchGroup.enter()
        
        // Send event to JavaScript
        sendEvent("onPrepareLicenseServerUrl", [
            "nativeId": nativeId,
            "licenseServerUrl": url
        ])
        
        // Wait for JS `onPrepareLicenseServerUrl` to finish its execution.
        dispatchGroup.wait()
        // Return value stored by `onPrepareLicenseServerUrl`.
        return preparedLicenseServerUrls[nativeId] ?? url
    }

    /**
     * Defines the body of a `prepareContentId` block in `FairplayConfig`.
     * Used to sync Native->JS and JS->Native calls during `prepareContentId` execution.
     */
    private func prepareContentIdFromJS(_ nativeId: String, _ contentId: String) -> String {
        // Setup dispatch group
        let dispatchGroup = DispatchGroup()
        dispatchGroup.enter()
        
        // Send event to JavaScript
        sendEvent("onPrepareContentId", [
            "nativeId": nativeId,
            "contentId": contentId
        ])
        
        // Wait for JS `onPrepareContentId` to finish its execution.
        dispatchGroup.wait()
        // Return value stored by `onPrepareContentId`.
        return preparedContentIds[nativeId] ?? contentId
    }

    /**
     * Static access method to maintain compatibility with other modules.
     * Retrieves the FairplayConfig for the given nativeId.
     */
    @objc
    public static func getDrmConfig(_ nativeId: String) -> FairplayConfig? {
        // TODO: Implement global registry pattern if needed by other modules
        return nil
    }
}