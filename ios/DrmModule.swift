import BitmovinPlayer
import ExpoModulesCore
import ExpoModulesJSI

public class DrmModule: Module {
    public func definition() -> ModuleDefinition {
        Name("DrmModule")
        Function("create") { (config: [String: Any], callback: JavaScriptValue) in
            try SharedDrmConfig(config: config, callback: CallbackScope(callback: callback, context: appContext))
        }
        Class("DrmConfig", SharedDrmConfig.self) {
            AsyncFunction("destroy") { (owner: SharedDrmConfig) in owner.destroy() }
        }
    }
}

public final class SharedDrmConfig: SharedObject {
    let config: FairplayConfig?
    private let callback: CallbackScope

    init(config json: [String: Any], callback: CallbackScope) {
        self.callback = callback
        config = RCTConvert.drmConfig(json).fairplay
        super.init()
        guard let fairplay = json["fairplay"] as? [String: Any], let config else { return }
        if fairplay["prepareCertificate"] != nil {
            config.prepareCertificate = { [weak self] data in
                self?.transform("prepareCertificate", data: data) ?? data
            }
        }
        if fairplay["prepareMessage"] != nil {
            config.prepareMessage = { [weak self] data, assetId in
                self?.transform("prepareMessage", data: data, arguments: [assetId]) ?? data
            }
        }
        if fairplay["prepareSyncMessage"] != nil {
            config.prepareSyncMessage = { [weak self] data, assetId in
                self?.transform("prepareSyncMessage", data: data, arguments: [assetId]) ?? data
            }
        }
        if fairplay["prepareLicense"] != nil {
            config.prepareLicense = { [weak self] data in
                self?.transform("prepareLicense", data: data) ?? data
            }
        }
        if fairplay["prepareLicenseServerUrl"] != nil {
            config.prepareLicenseServerUrl = { [weak self] url in
                self?.callback.call("prepareLicenseServerUrl", arguments: [url]) as? String ?? url
            }
        }
        if fairplay["prepareContentId"] != nil {
            config.prepareContentId = { [weak self] contentId in
                self?.callback.call("prepareContentId", arguments: [contentId]) as? String ?? contentId
            }
        }
    }

    private func transform(_ operation: String, data: Data, arguments: [Any] = []) -> Data {
        let result = callback.call(operation, arguments: [data.base64EncodedString()] + arguments)
        guard let value = result as? String else {
            return data
        }
        return Data(base64Encoded: value) ?? data
    }

    func destroy() { callback.close() }
    deinit { callback.close() }
    override public func sharedObjectWillRelease() { callback.close() }
}
