import BitmovinPlayer
import ExpoModulesCore
import Foundation

extension RCTConvert {
    static func fairplayConfig(_ json: [String: Any], callback: CallbackScope?, path: String) -> FairplayConfig? {
        let config = Self.drmConfig(json).fairplay
        guard let fairplay = json["fairplay"] as? [String: Any], let config else { return config }
        if fairplay["prepareCertificate"] != nil {
            config.prepareCertificate = { data in
                transform(callback, "\(path).fairplay.prepareCertificate", data: data)
            }
        }
        if fairplay["prepareMessage"] != nil {
            config.prepareMessage = { data, assetId in
                transform(callback, "\(path).fairplay.prepareMessage", data: data, arguments: [assetId])
            }
        }
        if fairplay["prepareSyncMessage"] != nil {
            config.prepareSyncMessage = { data, assetId in
                transform(callback, "\(path).fairplay.prepareSyncMessage", data: data, arguments: [assetId])
            }
        }
        if fairplay["prepareLicense"] != nil {
            config.prepareLicense = { data in
                transform(callback, "\(path).fairplay.prepareLicense", data: data)
            }
        }
        if fairplay["prepareLicenseServerUrl"] != nil {
            config.prepareLicenseServerUrl = { url in
                callback?.call("\(path).fairplay.prepareLicenseServerUrl", arguments: [url]) as? String ?? url
            }
        }
        if fairplay["prepareContentId"] != nil {
            config.prepareContentId = { contentId in
                callback?.call("\(path).fairplay.prepareContentId", arguments: [contentId]) as? String ?? contentId
            }
        }
        return config
    }
    private static func transform(
        _ callback: CallbackScope?,
        _ operation: String,
        data: Data,
        arguments: [Any] = []
    ) -> Data {
        let result = callback?.call(operation, arguments: [data.base64EncodedString()] + arguments)
        return (result as? String).flatMap { Data(base64Encoded: $0) } ?? data
    }
}
