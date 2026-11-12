import BitmovinPlayer
import ExpoModulesCore
import Foundation

extension RCTConvert {
    static func sourceConfig(_ json: Any?) -> SourceConfig? {
        let drm = ((json as? [String: Any])?["drmConfig"] as? [String: Any]).flatMap {
            Self.fairplayConfig($0)
        }
        return Self.sourceConfig(json, drmConfig: drm)
    }

    static func fairplayConfig(_ json: [String: Any]) -> FairplayConfig? {
        let config = Self.drmConfig(json).fairplay
        guard let fairplay = json["fairplay"] as? [String: Any], let config else { return config }
        if let callback = fairplay["prepareCertificate"] as? JavaScriptCallback {
            config.prepareCertificate = { data in
                transform(callback, data: data)
            }
        }
        if let callback = fairplay["prepareMessage"] as? JavaScriptCallback {
            config.prepareMessage = { data, assetId in
                transform(callback, data: data, arguments: [assetId])
            }
        }
        if let callback = fairplay["prepareSyncMessage"] as? JavaScriptCallback {
            config.prepareSyncMessage = { data, assetId in
                transform(callback, data: data, arguments: [assetId])
            }
        }
        if let callback = fairplay["prepareLicense"] as? JavaScriptCallback {
            config.prepareLicense = { data in
                transform(callback, data: data)
            }
        }
        if let callback = fairplay["prepareLicenseServerUrl"] as? JavaScriptCallback {
            config.prepareLicenseServerUrl = { url in
                callback.call(arguments: [url]) as? String ?? url
            }
        }
        if let callback = fairplay["prepareContentId"] as? JavaScriptCallback {
            config.prepareContentId = { contentId in
                callback.call(arguments: [contentId]) as? String ?? contentId
            }
        }
        return config
    }
    private static func transform(
        _ callback: JavaScriptCallback,
        data: Data,
        arguments: [Any] = []
    ) -> Data {
        let result = callback.call(arguments: [data.base64EncodedString()] + arguments)
        return (result as? String).flatMap { Data(base64Encoded: $0) } ?? data
    }
}
