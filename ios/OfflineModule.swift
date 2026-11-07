import BitmovinPlayer
import ExpoModulesCore
import Foundation

public class OfflineModule: Module {
    // swiftlint:disable:next function_body_length
    public func definition() -> ModuleDefinition {
        Name("OfflineModule")
        Function("create") { SharedOffline() }
        Class("OfflineContentManager", SharedOffline.self) {
            AsyncFunction("initialize") { (owner: SharedOffline, config: [String: Any], drm: SharedDrm?) in
                owner.initialize(config: config, drm: drm)
            }.runOnQueue(.main)
            AsyncFunction("getState") { (owner: SharedOffline) -> String? in
#if os(iOS)
                RCTConvert.toJson(offlineState: owner.bridge?.offlineContentManager.offlineState)
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
                owner.bridge?.offlineContentManager.usedStorage
#else
                nil
#endif
            }.runOnQueue(.main)
            AsyncFunction("deleteAll") { (owner: SharedOffline) in
#if os(iOS)
                owner.bridge?.offlineContentManager.deleteOfflineData()
#endif
            }.runOnQueue(.main)
            AsyncFunction("destroy") { (owner: SharedOffline) in owner.destroy() }.runOnQueue(.main)
            AsyncFunction("download") { (owner: SharedOffline, request: [String: Any]?) in
                owner.download(request)
            }.runOnQueue(.main)
            AsyncFunction("resume") { (owner: SharedOffline) in
#if os(iOS)
                owner.bridge?.offlineContentManager.resumeDownload()
#endif
            }.runOnQueue(.main)
            AsyncFunction("suspend") { (owner: SharedOffline) in
#if os(iOS)
                owner.bridge?.offlineContentManager.suspendDownload()
#endif
            }.runOnQueue(.main)
            AsyncFunction("cancelDownload") { (owner: SharedOffline) in
#if os(iOS)
                owner.bridge?.offlineContentManager.cancelDownload()
#endif
            }.runOnQueue(.main)
            AsyncFunction("downloadLicense") { (owner: SharedOffline) in
#if os(iOS)
                owner.bridge?.offlineContentManager.syncOfflineDrmLicenseInformation()
#endif
            }.runOnQueue(.main)
            AsyncFunction("renewOfflineLicense") { (owner: SharedOffline) in
#if os(iOS)
                owner.bridge?.offlineContentManager.renewOfflineLicense()
#endif
            }.runOnQueue(.main)
            AsyncFunction("releaseLicense") { (_: SharedOffline) in }.runOnQueue(.main)
        }
    }
}

public final class SharedOffline: SharedObject {
#if os(iOS)
    private(set) var bridge: OfflineContentManagerBridge?
#endif
    private var drm: SharedDrm?

    func initialize(config: [String: Any], drm: SharedDrm?) {
#if os(iOS)
        guard bridge == nil, let identifier = config["identifier"] as? String,
              let sourceConfig = RCTConvert.sourceConfig(config["sourceConfig"], drmConfig: drm?.config) else { return }
        self.drm = drm
        do {
            let manager = try OfflineManager.sharedInstance().offlineContentManager(for: sourceConfig, id: identifier)
            bridge = OfflineContentManagerBridge(forManager: manager, owner: self, identifier: identifier)
        } catch {}
#endif
    }

    func destroy() {
#if os(iOS)
        bridge?.release()
        bridge = nil
#endif
        drm = nil
    }

    deinit {
#if os(iOS)
        if let bridge { DispatchQueue.main.async { bridge.release() } }
#endif
    }

    func download(_ request: [String: Any]?) {
#if os(iOS)
        guard let bridge, let request, bridge.offlineContentManager.offlineState == .notDownloaded,
              let tracks = bridge.currentTrackSelection else { return }
        if let audioOptionIds = request["audioOptionIds"] as? [String], !audioOptionIds.isEmpty {
            tracks.audioTracks.forEach { $0.action = audioOptionIds.contains($0.label) ? .download : .none }
        }
        if let textOptionIds = request["textOptionIds"] as? [String], !textOptionIds.isEmpty {
            tracks.textTracks.forEach { $0.action = textOptionIds.contains($0.label) ? .download : .none }
        }
        let config = DownloadConfig()
        config.minimumBitrate = request["minimumBitrate"] as? NSNumber
        bridge.offlineContentManager.download(tracks: tracks, downloadConfig: config)
#endif
    }
}
