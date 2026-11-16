import BitmovinPlayer
import ExpoModulesCore
import ExpoModulesJSI

public class SourceModule: Module {
    public func definition() -> ModuleDefinition {
        Name("SourceModule")
        Class(SharedSource.self) {
            Constructor { (config: JavaScriptValue?, analytics: [String: Any]?) in
                guard let appContext else { throw Exceptions.AppContextLost() }
                return try JavaScriptActor.assumeIsolated {
                    try SharedSource(config: config, analytics: analytics, context: appContext)
                }
            }
            Property("configSnapshot") { (owner: SharedSource) in owner.configSnapshot }
            AsyncFunction("isAttachedToPlayer") { (owner: SharedSource) -> Bool in
                owner.source.isAttachedToPlayer
            }.runOnQueue(.main)
            AsyncFunction("isActive") { (owner: SharedSource) -> Bool in
                owner.source.isActive
            }.runOnQueue(.main)
            AsyncFunction("duration") { (owner: SharedSource) -> Double in
                owner.source.duration
            }.runOnQueue(.main)
            AsyncFunction("loadingState") { (owner: SharedSource) -> Int in
                owner.source.loadingState.rawValue
            }.runOnQueue(.main)
            AsyncFunction("metadata") { (owner: SharedSource) -> [String: Any]? in
                let source = owner.source
                if let metadata = source.metadata { return metadata }
                let metadata = source.sourceConfig.metadata
                return metadata.isEmpty ? nil : metadata
            }.runOnQueue(.main)
            AsyncFunction("setMetadata") { (owner: SharedSource, metadata: [String: Any]?) in
                let source = owner.source
                source.sourceConfig.metadata = metadata ?? [:]
                source.metadata = metadata as [String: AnyObject]?
            }.runOnQueue(.main)
            AsyncFunction("getThumbnail") { (owner: SharedSource, time: Double) -> [String: Any]? in
                guard let thumbnail = owner.source.thumbnail(forTime: time) else { return nil }
                return RCTConvert.toJson(thumbnail: thumbnail)
            }.runOnQueue(.main)
            AsyncFunction("drmFairplayRenewExpiringLicense") { (owner: SharedSource, skdUri: String) in
                guard let request = owner.fairplayRequests.request(for: skdUri) else { return }
                owner.source.drm.fairplay.renewExpiringLicense(for: request)
            }.runOnQueue(.main)
        }
    }
}
