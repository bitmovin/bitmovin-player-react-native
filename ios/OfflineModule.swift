import BitmovinPlayer
import ExpoModulesCore
import Foundation

public class OfflineModule: Module {
    #if os(iOS)
    private var offlineContentManagerBridges: Registry<OfflineContentManagerBridge> = [:]
    #endif

    // swiftlint:disable:next function_body_length
    public func definition() -> ModuleDefinition {
        Name("OfflineModule")
        Events("onBitmovinOfflineEvent")
        OnCreate {
            // Module initialization
        }
        OnDestroy {
            #if os(iOS)
            self.offlineContentManagerBridges.removeAll()
            #endif
        }
        AsyncFunction("initializeWithConfig") { [weak self] (nativeId: NativeId, config: [String: Any?]?, drmNativeId: NativeId?) in // swiftlint:disable:this line_length
            #if os(iOS)
            self?.createOfflineManager(nativeId: nativeId, config: config, drmNativeId: drmNativeId)
            #endif
        }.runOnQueue(.main)
        AsyncFunction("getState") { [weak self] (nativeId: NativeId) -> String? in
            #if os(iOS)
            let offlineState = self?.offlineContentManagerBridges[nativeId]?.offlineContentManager.offlineState
            return RCTConvert.toJson(offlineState: offlineState)
            #else
            return nil
            #endif
        }.runOnQueue(.main)
        AsyncFunction("getOptions") { [weak self] (nativeId: NativeId) in
            #if os(iOS)
            self?.offlineContentManagerBridges[nativeId]?.fetchAvailableTracks()
            #endif
        }.runOnQueue(.main)
        AsyncFunction("usedStorage") { [weak self] (nativeId: NativeId) -> Int? in
            #if os(iOS)
            return self?.offlineContentManagerBridges[nativeId]?.offlineContentManager.usedStorage
            #else
            return nil
            #endif
        }.runOnQueue(.main)
        AsyncFunction("deleteAll") { [weak self] (nativeId: NativeId) in
            #if os(iOS)
            self?.offlineContentManagerBridges[nativeId]?.offlineContentManager.deleteOfflineData()
            #endif
        }.runOnQueue(.main)
        AsyncFunction("release") { [weak self] (nativeId: NativeId) in
            #if os(iOS)
            self?.offlineContentManagerBridges[nativeId]?.release()
            self?.offlineContentManagerBridges[nativeId] = nil
            #endif
        }.runOnQueue(.main)
        AsyncFunction("download") { [weak self] (nativeId: NativeId, request: [String: Any?]?) in
            #if os(iOS)
            self?.download(nativeId: nativeId, request: request)
            #endif
        }.runOnQueue(.main)
        AsyncFunction("resume") { [weak self] (nativeId: NativeId) in
            #if os(iOS)
            self?.offlineContentManagerBridges[nativeId]?.offlineContentManager.resumeDownload()
            #endif
        }.runOnQueue(.main)
        AsyncFunction("suspend") { [weak self] (nativeId: NativeId) in
            #if os(iOS)
            self?.offlineContentManagerBridges[nativeId]?.offlineContentManager.suspendDownload()
            #endif
        }.runOnQueue(.main)
        AsyncFunction("cancelDownload") { [weak self] (nativeId: NativeId) in
            #if os(iOS)
            self?.offlineContentManagerBridges[nativeId]?.offlineContentManager.cancelDownload()
            #endif
        }.runOnQueue(.main)
        AsyncFunction("downloadLicense") { [weak self] (nativeId: NativeId) in
            #if os(iOS)
            self?.offlineContentManagerBridges[nativeId]?.offlineContentManager.syncOfflineDrmLicenseInformation()
            #endif
        }.runOnQueue(.main)
        AsyncFunction("renewOfflineLicense") { [weak self] (nativeId: NativeId) in
            #if os(iOS)
            self?.offlineContentManagerBridges[nativeId]?.offlineContentManager.renewOfflineLicense()
            #endif
        }.runOnQueue(.main)
        AsyncFunction("releaseLicense") { (_: String) in
            // No-op on iOS
        }.runOnQueue(.main)
    }

    #if os(iOS)
    private func createOfflineManager(nativeId: NativeId, config: [String: Any?]?, drmNativeId: NativeId?) {
        if self.offlineContentManagerBridges[nativeId] != nil {
            return
        }
        guard let config, let identifier = config["identifier"] as? String else {
            return
        }
        let fairplayConfig = drmNativeId.flatMap { appContext?.moduleRegistry.get(DrmModule.self)?.retrieve($0) }
        guard let sourceConfigDict = config["sourceConfig"],
              let sourceConfig = RCTConvert.sourceConfig(sourceConfigDict, drmConfig: fairplayConfig) else {
            return
        }
        do {
            let offlineContentManager = try OfflineManager.sharedInstance()
                .offlineContentManager(for: sourceConfig, id: identifier)
            let offlineContentManagerBridge = OfflineContentManagerBridge(
                forManager: offlineContentManager,
                module: self,
                nativeId: nativeId,
                identifier: identifier
            )
            self.offlineContentManagerBridges[nativeId] = offlineContentManagerBridge
        } catch {}
    }

    private func download(nativeId: NativeId, request: [String: Any?]?) {
        guard let offlineContentManagerBridge = self.offlineContentManagerBridges[nativeId], let request else {
            return
        }
        guard offlineContentManagerBridge.offlineContentManager.offlineState == .notDownloaded else {
            return
        }

        guard let currentTrackSelection = offlineContentManagerBridge.currentTrackSelection else {
            return
        }
        if let audioOptionIds = request["audioOptionIds"] as? [String], !audioOptionIds.isEmpty {
            currentTrackSelection.audioTracks.forEach {
                $0.action = audioOptionIds.contains($0.label) ? .download : .none
            }
        }
        if let textOptionIds = request["textOptionIds"] as? [String], !textOptionIds.isEmpty {
            currentTrackSelection.textTracks.forEach {
                $0.action = textOptionIds.contains($0.label) ? .download : .none
            }
        }
        let config = DownloadConfig()
        if let minimumBitrate = request["minimumBitrate"] as? NSNumber {
            config.minimumBitrate = minimumBitrate
        }
        offlineContentManagerBridge.offlineContentManager.download(
            tracks: currentTrackSelection,
            downloadConfig: config
        )
    }
    #endif

    internal func retrieve(_ nativeId: NativeId) -> OfflineContentManagerBridge? {
        #if os(iOS)
        return self.offlineContentManagerBridges[nativeId]
        #else
        return nil
        #endif
    }
}
