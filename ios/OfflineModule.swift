import BitmovinPlayer
import ExpoModulesCore
import ExpoModulesJSI
import Foundation

public class OfflineModule: Module {
    // swiftlint:disable:next function_body_length
    public func definition() -> ModuleDefinition {
        Name("OfflineModule")
        Class(SharedOfflineEvents.self) { Constructor { SharedOfflineEvents() } }
        Class(SharedOfflineContentManager.self) {
            Constructor { (config: JavaScriptValue, events: SharedOfflineEvents) in
                guard let appContext else { throw Exceptions.AppContextLost() }
                return try JavaScriptActor.assumeIsolated {
                    try SharedOfflineContentManager(config: config, context: appContext, events: events)
                }
            }
            Property("events") { (owner: SharedOfflineContentManager) in owner.events }
            AsyncFunction("state") { (owner: SharedOfflineContentManager) -> String? in
#if os(iOS)
                RCTConvert.toJson(offlineState: (try owner.offlineContentManager).offlineState)
#else
                nil
#endif
            }.runOnQueue(.main)
            AsyncFunction("getOptions") { (owner: SharedOfflineContentManager) in
#if os(iOS)
                (try owner.bridge).fetchAvailableTracks()
#endif
            }.runOnQueue(.main)
            AsyncFunction("usedStorage") { (owner: SharedOfflineContentManager) -> Int? in
#if os(iOS)
                (try owner.offlineContentManager).usedStorage
#else
                nil
#endif
            }.runOnQueue(.main)
            AsyncFunction("deleteAll") { (owner: SharedOfflineContentManager) in
#if os(iOS)
                (try owner.offlineContentManager).deleteOfflineData()
#endif
            }.runOnQueue(.main)
            AsyncFunction("destroy") { (owner: SharedOfflineContentManager) in owner.destroy() }.runOnQueue(.main)
            AsyncFunction("download") { (owner: SharedOfflineContentManager, request: [String: Any]?) in
                try owner.download(request)
            }.runOnQueue(.main)
            AsyncFunction("resume") { (owner: SharedOfflineContentManager) in
#if os(iOS)
                (try owner.offlineContentManager).resumeDownload()
#endif
            }.runOnQueue(.main)
            AsyncFunction("suspend") { (owner: SharedOfflineContentManager) in
#if os(iOS)
                (try owner.offlineContentManager).suspendDownload()
#endif
            }.runOnQueue(.main)
            AsyncFunction("cancelDownload") { (owner: SharedOfflineContentManager) in
#if os(iOS)
                (try owner.offlineContentManager).cancelDownload()
#endif
            }.runOnQueue(.main)
            AsyncFunction("downloadLicense") { (owner: SharedOfflineContentManager) in
#if os(iOS)
                (try owner.offlineContentManager).syncOfflineDrmLicenseInformation()
#endif
            }.runOnQueue(.main)
            AsyncFunction("renewOfflineLicense") { (owner: SharedOfflineContentManager) in
#if os(iOS)
                (try owner.offlineContentManager).renewOfflineLicense()
#endif
            }.runOnQueue(.main)
            AsyncFunction("releaseLicense") { (_: SharedOfflineContentManager) in }.runOnQueue(.main)
        }
    }
}
