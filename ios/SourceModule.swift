import BitmovinPlayer
import ExpoModulesCore
import ExpoModulesJSI

public class SourceModule: Module {
    public func definition() -> ModuleDefinition {
        Name("SourceModule")
        Class("Source", SharedSource.self) {
            Constructor { (config: [String: Any]?, analytics: [String: Any]?, callback: JavaScriptValue?) in
                try SharedSource(
                    config: config,
                    analytics: analytics,
                    callback: callback.map { try CallbackScope(callback: $0, context: appContext) }
                )
            }
            Property("configSnapshot") { (owner: SharedSource) in owner.configSnapshot }
            AsyncFunction("isAttachedToPlayer") { (owner: SharedSource) -> Bool in
                (try owner.source).isAttachedToPlayer
            }.runOnQueue(.main)
            AsyncFunction("isActive") { (owner: SharedSource) -> Bool in
                (try owner.source).isActive
            }.runOnQueue(.main)
            AsyncFunction("duration") { (owner: SharedSource) -> Double in
                (try owner.source).duration
            }.runOnQueue(.main)
            AsyncFunction("loadingState") { (owner: SharedSource) -> Int in
                (try owner.source).loadingState.rawValue
            }.runOnQueue(.main)
            AsyncFunction("metadata") { (owner: SharedSource) -> [String: Any]? in
                let source = (try owner.source)
                if let metadata = source.metadata { return metadata }
                let metadata = source.sourceConfig.metadata
                return metadata.isEmpty ? nil : metadata
            }.runOnQueue(.main)
            AsyncFunction("setMetadata") { (owner: SharedSource, metadata: [String: Any]?) in
                let source = (try owner.source)
                source.sourceConfig.metadata = metadata ?? [:]
                source.metadata = metadata as [String: AnyObject]?
            }.runOnQueue(.main)
            AsyncFunction("getThumbnail") { (owner: SharedSource, time: Double) -> [String: Any]? in
                guard let thumbnail = (try owner.source).thumbnail(forTime: time) else { return nil }
                return RCTConvert.toJson(thumbnail: thumbnail)
            }.runOnQueue(.main)
            AsyncFunction("drmFairplayRenewExpiringLicense") { (owner: SharedSource, skdUri: String) in
                guard let request = (try owner.fairplayRequests).request(for: skdUri) else { return }
                (try owner.source).drm.fairplay.renewExpiringLicense(for: request)
            }.runOnQueue(.main)
        }
    }
}
