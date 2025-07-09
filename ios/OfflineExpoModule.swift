import BitmovinPlayer
import ExpoModulesCore
import Foundation

public class OfflineExpoModule: Module {
    #if os(iOS)
    private var offlineContentManagerBridges: Registry<OfflineContentManagerBridge> = [:]
    #endif

    public func definition() -> ModuleDefinition {
        Name("OfflineExpoModule")
        Events("BitmovinOfflineEvent")
        OnCreate {
            // Module initialization
        }
        OnDestroy {
            #if os(iOS)
            self.offlineContentManagerBridges.removeAll()
            #endif
        }
        AsyncFunction("initializeWithConfig") { [weak self] (nativeId: String, config: [String: Any?]?, drmNativeId: String?) in
            #if os(iOS)
            self?.createOfflineManager(nativeId: nativeId, config: config, drmNativeId: drmNativeId)
            #endif
        }
        AsyncFunction("getState") { [weak self] (nativeId: String) -> String? in
            #if os(iOS)
            let offlineState = self?.offlineContentManagerBridges[nativeId]?.offlineContentManager.offlineState
            return RCTConvert.toJson(offlineState: offlineState)
            #else
            return nil
            #endif
        }
        AsyncFunction("getOptions") { [weak self] (nativeId: String) in
            #if os(iOS)
            self?.offlineContentManagerBridges[nativeId]?.fetchAvailableTracks()
            #endif
        }
        AsyncFunction("usedStorage") { [weak self] (nativeId: String) -> Int? in
            #if os(iOS)
            return self?.offlineContentManagerBridges[nativeId]?.offlineContentManager.usedStorage
            #else
            return nil
            #endif
        }
        AsyncFunction("deleteAll") { [weak self] (nativeId: String) in
            #if os(iOS)
            self?.offlineContentManagerBridges[nativeId]?.offlineContentManager.deleteOfflineData()
            #endif
        }
        AsyncFunction("release") { [weak self] (nativeId: String) in
            #if os(iOS)
            self?.offlineContentManagerBridges[nativeId]?.release()
            self?.offlineContentManagerBridges[nativeId] = nil
            #endif
        }
        AsyncFunction("download") { [weak self] (nativeId: String, request: [String: Any?]?) in
            #if os(iOS)
            self?.download(nativeId: nativeId, request: request)
            #endif
        }
        AsyncFunction("resume") { [weak self] (nativeId: String) in
            #if os(iOS)
            self?.offlineContentManagerBridges[nativeId]?.offlineContentManager.resumeDownload()
            #endif
        }
        AsyncFunction("suspend") { [weak self] (nativeId: String) in
            #if os(iOS)
            self?.offlineContentManagerBridges[nativeId]?.offlineContentManager.suspendDownload()
            #endif
        }
        AsyncFunction("cancelDownload") { [weak self] (nativeId: String) in
            #if os(iOS)
            self?.offlineContentManagerBridges[nativeId]?.offlineContentManager.cancelDownload()
            #endif
        }
        AsyncFunction("downloadLicense") { [weak self] (nativeId: String) in
            #if os(iOS)
            self?.offlineContentManagerBridges[nativeId]?.offlineContentManager.syncOfflineDrmLicenseInformation()
            #endif
        }
        AsyncFunction("renewOfflineLicense") { [weak self] (nativeId: String) in
            #if os(iOS)
            self?.offlineContentManagerBridges[nativeId]?.offlineContentManager.renewOfflineLicense()
            #endif
        }
        AsyncFunction("releaseLicense") { (_: String) in
            // No-op on iOS
        }
    }

    #if os(iOS)
    private func createOfflineManager(nativeId: String, config: [String: Any?]?, drmNativeId: String?) {
        if self.offlineContentManagerBridges[nativeId] != nil {
            return
        }
        guard let config, let identifier = config["identifier"] as? String else {
            return
        }
        let fairplayConfig = drmNativeId.flatMap { appContext?.moduleRegistry.get(DrmExpoModule.self)?.retrieve($0) }
        guard let sourceConfigDict = config["sourceConfig"],
              let sourceConfig = RCTConvert.sourceConfig(sourceConfigDict, drmConfig: fairplayConfig) else {
            return
        }
        do {
            let offlineContentManager = try OfflineManager.sharedInstance()
                .offlineContentManager(for: sourceConfig, id: identifier)
            let offlineContentManagerBridge = OfflineContentManagerBridge(
                forManager: offlineContentManager,
                eventEmitter: appContext?.eventEmitter,
                nativeId: nativeId,
                identifier: identifier
            )
            self.offlineContentManagerBridges[nativeId] = offlineContentManagerBridge
        } catch {}
    }

    private func download(nativeId: String, request: [String: Any?]?) {
        guard let offlineContentManagerBridge = self.offlineContentManagerBridges[nativeId], let request else {
            return
        }
        switch offlineContentManagerBridge.offlineContentManager.offlineState {
        case .downloaded, .downloading, .suspended, .canceling: // TODO double check if canceling is correct
            return
        case .notDownloaded:
            break
        @unknown default:
            break
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

    @objc
    internal func retrieve(_ nativeId: NativeId) -> OfflineContentManagerBridge? {
        #if os(iOS)
        return self.offlineContentManagerBridges[nativeId]
        #else
        return nil
        #endif
    }
}

extension OfflineExpoModule {
    func sendEvent(name: String, body: [String: Any?]) {
        sendEvent("BitmovinOfflineEvent", body)
    }
}
