import BitmovinPlayer
import ExpoModulesCore
import ExpoModulesJSI
import Foundation

public class OfflineModule: Module {
    // swiftlint:disable:next function_body_length
    public func definition() -> ModuleDefinition {
        Name("OfflineModule")
        Class("OfflineEvents", SharedOfflineEvents.self) { Constructor { SharedOfflineEvents() } }
        Class("OfflineContentManager", SharedOffline.self) {
            Constructor { (config: [String: Any], events: SharedOfflineEvents, callback: JavaScriptValue?) in
                try SharedOffline(config: config,
                    callback: callback.map { try CallbackScope(callback: $0, context: appContext) }, events: events)
            }
            AsyncFunction("initialize") { (owner: SharedOffline) in try owner.initialize() }.runOnQueue(.main)
            Property("events") { (owner: SharedOffline) in owner.events }
            AsyncFunction("state") { (owner: SharedOffline) -> String? in
#if os(iOS)
                RCTConvert.toJson(offlineState: (try owner.offlineContentManager).offlineState)
#else
                nil
#endif
            }.runOnQueue(.main)
            AsyncFunction("getOptions") { (owner: SharedOffline) in
#if os(iOS)
                (try owner.bridge).fetchAvailableTracks()
#endif
            }.runOnQueue(.main)
            AsyncFunction("usedStorage") { (owner: SharedOffline) -> Int? in
#if os(iOS)
                (try owner.offlineContentManager).usedStorage
#else
                nil
#endif
            }.runOnQueue(.main)
            AsyncFunction("deleteAll") { (owner: SharedOffline) in
#if os(iOS)
                (try owner.offlineContentManager).deleteOfflineData()
#endif
            }.runOnQueue(.main)
            AsyncFunction("destroy") { (owner: SharedOffline) in owner.destroy() }.runOnQueue(.main)
            AsyncFunction("download") { (owner: SharedOffline, request: [String: Any]?) in
                try owner.download(request)
            }.runOnQueue(.main)
            AsyncFunction("resume") { (owner: SharedOffline) in
#if os(iOS)
                (try owner.offlineContentManager).resumeDownload()
#endif
            }.runOnQueue(.main)
            AsyncFunction("suspend") { (owner: SharedOffline) in
#if os(iOS)
                (try owner.offlineContentManager).suspendDownload()
#endif
            }.runOnQueue(.main)
            AsyncFunction("cancelDownload") { (owner: SharedOffline) in
#if os(iOS)
                (try owner.offlineContentManager).cancelDownload()
#endif
            }.runOnQueue(.main)
            AsyncFunction("downloadLicense") { (owner: SharedOffline) in
#if os(iOS)
                (try owner.offlineContentManager).syncOfflineDrmLicenseInformation()
#endif
            }.runOnQueue(.main)
            AsyncFunction("renewOfflineLicense") { (owner: SharedOffline) in
#if os(iOS)
                (try owner.offlineContentManager).renewOfflineLicense()
#endif
            }.runOnQueue(.main)
            AsyncFunction("releaseLicense") { (_: SharedOffline) in }.runOnQueue(.main)
        }
    }
}
