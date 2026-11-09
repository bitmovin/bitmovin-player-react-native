import BitmovinPlayer
import ExpoModulesCore
import Foundation

public class OfflineModule: Module {
    // swiftlint:disable:next function_body_length
    public func definition() -> ModuleDefinition {
        Name("OfflineModule")
        Function("createEvents") { SharedOfflineEvents() }
        Class("OfflineEvents", SharedOfflineEvents.self) {}
        AsyncFunction("create") { (config: [String: Any], drm: SharedDrmConfig?, events: SharedOfflineEvents) in
#if os(iOS)
            guard let identifier = config["identifier"] as? String,
                  let sourceConfig = RCTConvert.sourceConfig(config["sourceConfig"], drmConfig: drm?.config) else {
                throw Exception(
                    name: "InvalidOfflineConfig",
                    description: "Invalid offline identifier or source configuration"
                )
            }
            let manager = try OfflineManager.sharedInstance().offlineContentManager(for: sourceConfig, id: identifier)
            return SharedOffline(manager: manager, identifier: identifier, drm: drm, events: events)
#else
            return SharedOffline(events: events)
#endif
        }.runOnQueue(.main)
        Class("OfflineContentManager", SharedOffline.self) {
            AsyncFunction("getState") { (owner: SharedOffline) -> String? in
#if os(iOS)
                RCTConvert.toJson(offlineState: owner.offlineContentManager.offlineState)
#else
                nil
#endif
            }.runOnQueue(.main)
            AsyncFunction("getOptions") { (owner: SharedOffline) in
#if os(iOS)
                owner.bridge?.fetchAvailableTracks()
#endif
            }.runOnQueue(.main)
            AsyncFunction("usedStorage") { (owner: SharedOffline) -> Int? in
#if os(iOS)
                owner.offlineContentManager.usedStorage
#else
                nil
#endif
            }.runOnQueue(.main)
            AsyncFunction("deleteAll") { (owner: SharedOffline) in
#if os(iOS)
                owner.offlineContentManager.deleteOfflineData()
#endif
            }.runOnQueue(.main)
            AsyncFunction("destroy") { (owner: SharedOffline) in owner.destroy() }.runOnQueue(.main)
            AsyncFunction("download") { (owner: SharedOffline, request: [String: Any]?) in
                owner.download(request)
            }.runOnQueue(.main)
            AsyncFunction("resume") { (owner: SharedOffline) in
#if os(iOS)
                owner.offlineContentManager.resumeDownload()
#endif
            }.runOnQueue(.main)
            AsyncFunction("suspend") { (owner: SharedOffline) in
#if os(iOS)
                owner.offlineContentManager.suspendDownload()
#endif
            }.runOnQueue(.main)
            AsyncFunction("cancelDownload") { (owner: SharedOffline) in
#if os(iOS)
                owner.offlineContentManager.cancelDownload()
#endif
            }.runOnQueue(.main)
            AsyncFunction("downloadLicense") { (owner: SharedOffline) in
#if os(iOS)
                owner.offlineContentManager.syncOfflineDrmLicenseInformation()
#endif
            }.runOnQueue(.main)
            AsyncFunction("renewOfflineLicense") { (owner: SharedOffline) in
#if os(iOS)
                owner.offlineContentManager.renewOfflineLicense()
#endif
            }.runOnQueue(.main)
            AsyncFunction("releaseLicense") { (_: SharedOffline) in }.runOnQueue(.main)
        }
    }
}
