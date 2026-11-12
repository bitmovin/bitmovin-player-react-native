import BitmovinPlayer
import ExpoModulesCore
import ExpoModulesJSI
import Foundation

extension RCTConvert {
    @JavaScriptActor
    static func sourceConfig(_ raw: JavaScriptValue?, context: AppContext) -> SourceConfig? {
        let json = raw?.getAny()
        let drm = raw?.property("drmConfig").flatMap { Self.fairplayConfig($0, context: context) }
        return Self.sourceConfig(json, drmConfig: drm)
    }

    @JavaScriptActor
    static func fairplayConfig(_ raw: JavaScriptValue, context: AppContext) -> FairplayConfig? {
        guard let json = raw.getAny() as? [String: Any] else { return nil }
        let config = Self.drmConfig(json).fairplay
        guard let fairplay = raw.property("fairplay"), let config else { return config }
        if let callback = weakCallback(fairplay, "prepareCertificate") {
            config.prepareCertificate = { [weak context] data in
                transform(callback, context: context, data: data)
            }
        }
        if let callback = weakCallback(fairplay, "prepareMessage") {
            config.prepareMessage = { [weak context] data, assetId in
                guard let context else { return data }
                return transform(callback, context: context, data: data, arguments: [assetId])
            }
        }
        if let callback = weakCallback(fairplay, "prepareSyncMessage") {
            config.prepareSyncMessage = { [weak context] data, assetId in
                guard let context else { return data }
                return transform(callback, context: context, data: data, arguments: [assetId])
            }
        }
        if let callback = weakCallback(fairplay, "prepareLicense") {
            config.prepareLicense = { [weak context] data in
                transform(callback, context: context, data: data)
            }
        }
        if let callback = weakCallback(fairplay, "prepareLicenseServerUrl") {
            config.prepareLicenseServerUrl = { [weak context] url in
                context.flatMap { context in
                    callback.callBlocking(context, arguments: [url]) { try $0.asString() }
                } ?? url
            }
        }
        if let callback = weakCallback(fairplay, "prepareContentId") {
            config.prepareContentId = { [weak context] contentId in
                context.flatMap { context in
                    callback.callBlocking(context, arguments: [contentId]) { try $0.asString() }
                } ?? contentId
            }
        }
        return config
    }
    private static func transform(
        _ callback: JavaScriptRef<JavaScriptWeakObject>,
        context: AppContext?,
        data: Data,
        arguments: [Any] = []
    ) -> Data {
        let result = context.flatMap { context in
            callback.callBlocking(context, arguments: [data.base64EncodedString()] + arguments) { (value: String) in
                Data(base64Encoded: value)
            }
        }
        return result ?? data
    }
}
