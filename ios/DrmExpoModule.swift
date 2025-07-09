import BitmovinPlayer
import ExpoModulesCore

public class DrmExpoModule: Module {
    private var drmConfigs: Registry<FairplayConfig> = [:]
    var preparedCertificates: Registry<String> = [:]
    var preparedMessages: Registry<String> = [:]
    var preparedSyncMessages: Registry<String> = [:]
    var preparedLicenses: Registry<String> = [:]
    var preparedLicenseServerUrls: Registry<String> = [:]
    var preparedContentIds: Registry<String> = [:]

    public func definition() -> ModuleDefinition {
        Name("DrmExpoModule")
        AsyncFunction("initializeWithConfig") { [weak self] (nativeId: String, config: [String: Any]) in
            self?.initializeWithConfig(nativeId: nativeId, config: config)
        }
        AsyncFunction("destroy") { [weak self] (nativeId: String) in
            self?.destroy(nativeId: nativeId)
        }
        Function("setPreparedCertificate") { (nativeId: String, certificate: String) in
            self.preparedCertificates[nativeId] = certificate
        }
        Function("setPreparedMessage") { (nativeId: String, message: String) in
            self.preparedMessages[nativeId] = message
        }
        Function("setPreparedSyncMessage") { (nativeId: String, syncMessage: String) in
            self.preparedSyncMessages[nativeId] = syncMessage
        }
        Function("setPreparedLicense") { (nativeId: String, license: String) in
            self.preparedLicenses[nativeId] = license
        }
        Function("setPreparedLicenseServerUrl") { (nativeId: String, url: String) in
            self.preparedLicenseServerUrls[nativeId] = url
        }
        Function("setPreparedContentId") { (nativeId: String, contentId: String) in
            self.preparedContentIds[nativeId] = contentId
        }
    }

    private func initializeWithConfig(nativeId: String, config: [String: Any]) {
        if self.drmConfigs[nativeId] == nil, let fairplayConfig = RCTConvert.drmConfig(config).fairplay {
            self.drmConfigs[nativeId] = fairplayConfig
            self.initConfigBlocks(nativeId, config)
        }
    }

    private func destroy(nativeId: String) {
        self.drmConfigs.removeValue(forKey: nativeId)
        self.preparedCertificates.removeValue(forKey: nativeId)
        self.preparedMessages.removeValue(forKey: nativeId)
        self.preparedSyncMessages.removeValue(forKey: nativeId)
        self.preparedLicenses.removeValue(forKey: nativeId)
        self.preparedLicenseServerUrls.removeValue(forKey: nativeId)
        self.preparedContentIds.removeValue(forKey: nativeId)
    }

    @objc
    func retrieve(_ nativeId: String) -> FairplayConfig? {
        drmConfigs[nativeId]
    }

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

    private func initPrepareCertificate(_ nativeId: String, fairplayJson: [String: Any]) {
        if fairplayJson["prepareCertificate"] != nil, let fairplayConfig = drmConfigs[nativeId] {
            fairplayConfig.prepareCertificate = { [weak self] data in
                self?.prepareCertificateFromJS(nativeId, data) ?? data
            }
        }
    }

    private func initPrepareMessage(_ nativeId: String, fairplayJson: [String: Any]) {
        if fairplayJson["prepareMessage"] != nil, let fairplayConfig = drmConfigs[nativeId] {
            fairplayConfig.prepareMessage = { [weak self] spcData, assetId in
                self?.prepareMessageFromJS(nativeId, spcData, assetId) ?? spcData
            }
        }
    }

    private func initPrepareSyncMessage(_ nativeId: String, fairplayJson: [String: Any]) {
        if fairplayJson["prepareSyncMessage"] != nil, let fairplayConfig = drmConfigs[nativeId] {
            fairplayConfig.prepareSyncMessage = { [weak self] syncSpcData, assetId in
                self?.prepareSyncMessageFromJS(nativeId, syncSpcData, assetId) ?? syncSpcData
            }
        }
    }

    private func initPrepareLicense(_ nativeId: String, fairplayJson: [String: Any]) {
        if fairplayJson["prepareLicense"] != nil, let fairplayConfig = drmConfigs[nativeId] {
            fairplayConfig.prepareLicense = { [weak self] data in
                self?.prepareLicenseFromJS(nativeId, data) ?? data
            }
        }
    }

    private func initPrepareLicenseServerUrl(_ nativeId: String, fairplayJson: [String: Any]) {
        if fairplayJson["prepareLicenseServerUrl"] != nil, let fairplayConfig = drmConfigs[nativeId] {
            fairplayConfig.prepareLicenseServerUrl = { [weak self] url in
                self?.prepareLicenseServerUrlFromJS(nativeId, url) ?? url
            }
        }
    }

    private func initPrepareContentId(_ nativeId: String, fairplayJson: [String: Any]) {
        if fairplayJson["prepareContentId"] != nil, let fairplayConfig = drmConfigs[nativeId] {
            fairplayConfig.prepareContentId = { [weak self] contentId in
                self?.prepareContentIdFromJS(nativeId, contentId) ?? contentId
            }
        }
    }

    private func prepareCertificateFromJS(_ nativeId: String, _ data: Data) -> Data {
        let dispatchGroup = DispatchGroup()
        dispatchGroup.enter()
        sendEvent("onPrepareCertificate", ["nativeId": nativeId, "certificate": data.base64EncodedString()])
        dispatchGroup.wait()
        return Data(base64Encoded: preparedCertificates[nativeId] ?? "") ?? data
    }

    private func prepareMessageFromJS(_ nativeId: String, _ data: Data, _ assetId: String) -> Data {
        let dispatchGroup = DispatchGroup()
        dispatchGroup.enter()
        sendEvent("onPrepareMessage", ["nativeId": nativeId, "message": data.base64EncodedString(), "assetId": assetId])
        dispatchGroup.wait()
        return Data(base64Encoded: preparedMessages[nativeId] ?? "") ?? data
    }

    private func prepareSyncMessageFromJS(_ nativeId: String, _ data: Data, _ assetId: String) -> Data {
        let dispatchGroup = DispatchGroup()
        dispatchGroup.enter()
        sendEvent("onPrepareSyncMessage", [
            "nativeId": nativeId,
            "syncMessage": data.base64EncodedString(),
            "assetId": assetId
        ])
        dispatchGroup.wait()
        return Data(base64Encoded: preparedSyncMessages[nativeId] ?? "") ?? data
    }

    private func prepareLicenseFromJS(_ nativeId: String, _ data: Data) -> Data {
        let dispatchGroup = DispatchGroup()
        dispatchGroup.enter()
        sendEvent("onPrepareLicense", ["nativeId": nativeId, "license": data.base64EncodedString()])
        dispatchGroup.wait()
        return Data(base64Encoded: preparedLicenses[nativeId] ?? "") ?? data
    }

    private func prepareLicenseServerUrlFromJS(_ nativeId: String, _ url: String) -> String {
        let dispatchGroup = DispatchGroup()
        dispatchGroup.enter()
        sendEvent("onPrepareLicenseServerUrl", ["nativeId": nativeId, "licenseServerUrl": url])
        dispatchGroup.wait()
        return preparedLicenseServerUrls[nativeId] ?? url
    }

    private func prepareContentIdFromJS(_ nativeId: String, _ contentId: String) -> String {
        let dispatchGroup = DispatchGroup()
        dispatchGroup.enter()
        sendEvent("onPrepareContentId", ["nativeId": nativeId, "contentId": contentId])
        dispatchGroup.wait()
        return preparedContentIds[nativeId] ?? contentId
    }

    @objc
    public static func getDrmConfig(_ nativeId: String) -> FairplayConfig? {
        nil
    }
}
