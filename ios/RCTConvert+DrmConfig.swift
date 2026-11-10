import BitmovinPlayer
import ExpoModulesCore
import Foundation

extension RCTConvert {
    static func sourceConfig(_ json: Any?, callback: CallbackScope?) -> SourceConfig? {
        let drm = ((json as? [String: Any])?["drmConfig"] as? [String: Any]).flatMap {
            Self.fairplayConfig($0, callback: callback)
        }
        return Self.sourceConfig(json, drmConfig: drm)
    }

    static func fairplayConfig(_ json: [String: Any], callback: CallbackScope?) -> FairplayConfig? {
        let config = Self.drmConfig(json).fairplay
        guard let fairplay = json["fairplay"] as? [String: Any], let config else { return config }
        if let token = fairplay["prepareCertificate"] as? String {
            config.prepareCertificate = { data in
                transform(callback, token, data: data)
            }
        }
        if let token = fairplay["prepareMessage"] as? String {
            config.prepareMessage = { data, assetId in
                transform(callback, token, data: data, arguments: [assetId])
            }
        }
        if let token = fairplay["prepareSyncMessage"] as? String {
            config.prepareSyncMessage = { data, assetId in
                transform(callback, token, data: data, arguments: [assetId])
            }
        }
        if let token = fairplay["prepareLicense"] as? String {
            config.prepareLicense = { data in
                transform(callback, token, data: data)
            }
        }
        if let token = fairplay["prepareLicenseServerUrl"] as? String {
            config.prepareLicenseServerUrl = { url in
                callback?.call(token, arguments: [url]) as? String ?? url
            }
        }
        if let token = fairplay["prepareContentId"] as? String {
            config.prepareContentId = { contentId in
                callback?.call(token, arguments: [contentId]) as? String ?? contentId
            }
        }
        return config
    }
    private static func transform(
        _ callback: CallbackScope?,
        _ token: String,
        data: Data,
        arguments: [Any] = []
    ) -> Data {
        let result = callback?.call(token, arguments: [data.base64EncodedString()] + arguments)
        return (result as? String).flatMap { Data(base64Encoded: $0) } ?? data
    }
}
