import BitmovinPlayer
import ExpoModulesCore

public class DrmModule: Module {
    private var drmConfigs: Registry<FairplayConfig> = [:]
    private let waiter = ResultWaiter<String>()

    public func definition() -> ModuleDefinition {
        Name("DrmModule")

        OnDestroy {
            drmConfigs.removeAll()
            waiter.removeAll()
        }

        Events(
            "onPrepareCertificate",
            "onPrepareMessage",
            "onPrepareSyncMessage",
            "onPrepareLicense",
            "onPrepareLicenseServerUrl",
            "onPrepareContentId"
        )
        AsyncFunction("initializeWithConfig") { [weak self] (nativeId: NativeId, config: [String: Any]) in
            self?.initializeWithConfig(nativeId: nativeId, config: config)
        }
        AsyncFunction("destroy") { [weak self] (nativeId: NativeId) in
            self?.destroy(nativeId: nativeId)
        }
        AsyncFunction("setPreparedCertificate") { [weak self] (id: Int, certificate: String?) in
            self?.waiter.complete(id: id, with: certificate ?? "")
        }
        AsyncFunction("setPreparedMessage") { [weak self] (id: Int, message: String?) in
            self?.waiter.complete(id: id, with: message ?? "")
        }
        AsyncFunction("setPreparedSyncMessage") { [weak self] (id: Int, syncMessage: String?) in
            self?.waiter.complete(id: id, with: syncMessage ?? "")
        }
        AsyncFunction("setPreparedLicense") { [weak self] (id: Int, license: String?) in
            self?.waiter.complete(id: id, with: license ?? "")
        }
        AsyncFunction("setPreparedLicenseServerUrl") { [weak self] (id: Int, url: String?) in
            self?.waiter.complete(id: id, with: url ?? "")
        }
        AsyncFunction("setPreparedContentId") { [weak self] (id: Int, contentId: String?) in
            self?.waiter.complete(id: id, with: contentId ?? "")
        }
    }

    private func initializeWithConfig(nativeId: NativeId, config: [String: Any]) {
        if self.drmConfigs[nativeId] == nil, let fairplayConfig = RCTConvert.drmConfig(config).fairplay {
            self.drmConfigs[nativeId] = fairplayConfig
            self.initConfigBlocks(nativeId, config)
        }
    }

    private func destroy(nativeId: NativeId) {
        self.drmConfigs.removeValue(forKey: nativeId)
    }

    func retrieve(_ nativeId: NativeId) -> FairplayConfig? {
        drmConfigs[nativeId]
    }

    private func initConfigBlocks(_ nativeId: NativeId, _ config: [String: Any]) {
        if let fairplayJson = config["fairplay"] as? [String: Any] {
            initPrepareCertificate(nativeId, fairplayJson: fairplayJson)
            initPrepareMessage(nativeId, fairplayJson: fairplayJson)
            initPrepareSyncMessage(nativeId, fairplayJson: fairplayJson)
            initPrepareLicense(nativeId, fairplayJson: fairplayJson)
            initPrepareLicenseServerUrl(nativeId, fairplayJson: fairplayJson)
            initPrepareContentId(nativeId, fairplayJson: fairplayJson)
        }
    }

    private func initPrepareCertificate(_ nativeId: NativeId, fairplayJson: [String: Any]) {
        if fairplayJson["prepareCertificate"] != nil, let fairplayConfig = drmConfigs[nativeId] {
            fairplayConfig.prepareCertificate = { [weak self] data in
                self?.prepareCertificateFromJS(nativeId, data) ?? data
            }
        }
    }

    private func initPrepareMessage(_ nativeId: NativeId, fairplayJson: [String: Any]) {
        if fairplayJson["prepareMessage"] != nil, let fairplayConfig = drmConfigs[nativeId] {
            fairplayConfig.prepareMessage = { [weak self] spcData, assetId in
                self?.prepareMessageFromJS(nativeId, spcData, assetId) ?? spcData
            }
        }
    }

    private func initPrepareSyncMessage(_ nativeId: NativeId, fairplayJson: [String: Any]) {
        if fairplayJson["prepareSyncMessage"] != nil, let fairplayConfig = drmConfigs[nativeId] {
            fairplayConfig.prepareSyncMessage = { [weak self] syncSpcData, assetId in
                self?.prepareSyncMessageFromJS(nativeId, syncSpcData, assetId) ?? syncSpcData
            }
        }
    }

    private func initPrepareLicense(_ nativeId: NativeId, fairplayJson: [String: Any]) {
        if fairplayJson["prepareLicense"] != nil, let fairplayConfig = drmConfigs[nativeId] {
            fairplayConfig.prepareLicense = { [weak self] data in
                self?.prepareLicenseFromJS(nativeId, data) ?? data
            }
        }
    }

    private func initPrepareLicenseServerUrl(_ nativeId: NativeId, fairplayJson: [String: Any]) {
        if fairplayJson["prepareLicenseServerUrl"] != nil, let fairplayConfig = drmConfigs[nativeId] {
            fairplayConfig.prepareLicenseServerUrl = { [weak self] url in
                self?.prepareLicenseServerUrlFromJS(nativeId, url) ?? url
            }
        }
    }

    private func initPrepareContentId(_ nativeId: NativeId, fairplayJson: [String: Any]) {
        if fairplayJson["prepareContentId"] != nil, let fairplayConfig = drmConfigs[nativeId] {
            fairplayConfig.prepareContentId = { [weak self] contentId in
                self?.prepareContentIdFromJS(nativeId, contentId) ?? contentId
            }
        }
    }

    private func prepareCertificateFromJS(_ nativeId: NativeId, _ data: Data) -> Data {
        let (id, wait) = waiter.make(timeout: 0.25)
        sendEvent("onPrepareCertificate", [
            "nativeId": nativeId,
            "id": id,
            "certificate": data.base64EncodedString()
        ])
        let result = wait() ?? data.base64EncodedString()
        return Data(base64Encoded: result) ?? data
    }

    private func prepareMessageFromJS(_ nativeId: NativeId, _ data: Data, _ assetId: String) -> Data {
        let (id, wait) = waiter.make(timeout: 0.25)
        sendEvent("onPrepareMessage", [
            "nativeId": nativeId,
            "id": id,
            "message": data.base64EncodedString(),
            "assetId": assetId
        ])
        let result = wait() ?? data.base64EncodedString()
        return Data(base64Encoded: result) ?? data
    }

    private func prepareSyncMessageFromJS(_ nativeId: NativeId, _ data: Data, _ assetId: String) -> Data {
        let (id, wait) = waiter.make(timeout: 0.25)
        sendEvent("onPrepareSyncMessage", [
            "nativeId": nativeId,
            "id": id,
            "syncMessage": data.base64EncodedString(),
            "assetId": assetId
        ])
        let result = wait() ?? data.base64EncodedString()
        return Data(base64Encoded: result) ?? data
    }

    private func prepareLicenseFromJS(_ nativeId: NativeId, _ data: Data) -> Data {
        let (id, wait) = waiter.make(timeout: 0.25)
        sendEvent("onPrepareLicense", [
            "nativeId": nativeId,
            "id": id,
            "license": data.base64EncodedString()
        ])
        let result = wait() ?? data.base64EncodedString()
        return Data(base64Encoded: result) ?? data
    }

    private func prepareLicenseServerUrlFromJS(_ nativeId: NativeId, _ url: String) -> String {
        let (id, wait) = waiter.make(timeout: 0.25)
        sendEvent("onPrepareLicenseServerUrl", [
            "nativeId": nativeId,
            "id": id,
            "licenseServerUrl": url
        ])
        return wait() ?? url
    }

    private func prepareContentIdFromJS(_ nativeId: NativeId, _ contentId: String) -> String {
        let (id, wait) = waiter.make(timeout: 0.25)
        sendEvent("onPrepareContentId", [
            "nativeId": nativeId,
            "id": id,
            "contentId": contentId
        ])
        return wait() ?? contentId
    }
}
