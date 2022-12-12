import Foundation
import BitmovinPlayer

@objc(OfflineModule)
class OfflineModule: RCTEventEmitter, OfflineContentManagerListener {
    
    /// JS module name.
    override static func moduleName() -> String! {
        "BitmovinOfflineModule"
    }
    
    /// Module requires main thread initialization.
    override static func requiresMainQueueSetup() -> Bool {
        true
    }
    
    override func supportedEvents() -> [String]! {
        return ["BitmovinOfflineEvent"]
    }
    
    /// Since most `OfflineModule` operations are UI related and need to be executed on the main thread, they are scheduled with `UIManager.addBlock`.
    override var methodQueue: DispatchQueue! {
        bridge.uiManager.methodQueue
    }

    
    private var offlineContentManagers: [String: OfflineContentManager] = [:]
    private var offlineTrackSelections: [String: OfflineTrackSelection] = [:]
    
    func retrieve(_ nativeId: NativeId) -> OfflineContentManager? {
        offlineContentManagers[nativeId]
    }
    
    /**
     Creates a new `OfflineContentManager` instance inside the internal offline managers using the provided `config` object.
     - @param config `Config` object received from JS.  Should contain a sourceConfig and location.
     */
    @objc func initWithConfig(_ nativeId: NativeId, config: Any?, resolver resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
        bridge.uiManager.addUIBlock { [weak self] _, _ in
            guard
                self?.offlineContentManagers[nativeId] == nil,
                let config = config as? [String: Any?],
                let sourceConfig = RCTConvert.sourceConfig(config["sourceConfig"])
            else {
                return
            }
            
            do {
                let contentManager = try OfflineManager.sharedInstance().offlineContentManager(for: sourceConfig)
                contentManager.add(listener: self!)
                
                self?.offlineContentManagers[nativeId] = contentManager
            } catch let error as NSError {
                reject("BitmovinOfflineModule", "Could not create an offline content manager", error)
            }
        }
    }
    
    /**
     asdf
     */
    @objc func getOptions(_ nativeId: NativeId) {
        bridge.uiManager.addUIBlock { [weak self] _, _ in
            guard
                let contentManager = self?.offlineContentManagers[nativeId]
            else {
                return
            }
            
            contentManager.fetchAvailableTracks()
        }
    }
    
    /**
     asdf
     - @param `config` object received from JS.  Should contain a sourceConfig and location.
     */
    @objc func process(_ nativeId: NativeId, request: Any?, resolver resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
        bridge.uiManager.addUIBlock { [weak self] _, _ in
            guard
                let contentManager = self?.offlineContentManagers[nativeId],
                let tracks = self?.offlineTrackSelections[nativeId],
                let request = request as? [String:Any?],
                let minimumBitrate = request["minimumBitrate"] as? NSNumber,
                let audioOptionIds = request["audioOptionIds"] as? [String],
                let textOptionIds = request["textOptionIds"] as? [String],
                audioOptionIds.count > 0
            else {
                reject("BitmovinOfflineModule", "Invalid download request", nil)
                return
            }
            
            //TODO use the requested audio / text ids to set the actions correctly.
            var config = DownloadConfig()
            config.minimumBitrate = minimumBitrate
            contentManager.download(tracks: tracks, downloadConfig: config)
        }
    }
    
    /**
     asdf
     */
    @objc func resume(_ nativeId: NativeId) {
        bridge.uiManager.addUIBlock { [weak self] _, _ in
            guard
                let contentManager = self?.offlineContentManagers[nativeId]
            else {
                return
            }
            contentManager.resumeDownload()
        }
    }
    
    /**
     asdf
     */
    @objc func suspend(_ nativeId: NativeId) {
        bridge.uiManager.addUIBlock { [weak self] _, _ in
            guard
                let contentManager = self?.offlineContentManagers[nativeId]
            else {
                return
            }
            contentManager.suspendDownload()
        }
    }
    
    /**
     asdf
     */
    @objc func deleteAll(_ nativeId: NativeId) {
        bridge.uiManager.addUIBlock { [weak self] _, _ in
            guard
                let contentManager = self?.offlineContentManagers[nativeId]
            else {
                return
            }
            contentManager.deleteOfflineData()
        }
    }
    
    /**
     asdf
     */
    @objc func renewOfflineLicense(_ nativeId: NativeId) {
        bridge.uiManager.addUIBlock { [weak self] _, _ in
            guard
                let contentManager = self?.offlineContentManagers[nativeId]
            else {
                return
            }
            contentManager.renewOfflineLicense()
        }
    }
    
    /**
     asdf
     */
    @objc func downloadLicense(_ nativeId: NativeId) {
        bridge.uiManager.addUIBlock { [weak self] _, _ in
            guard
                let contentManager = self?.offlineContentManagers[nativeId]
            else {
                return
            }
            contentManager.syncOfflineDrmLicenseInformation()
        }
    }
    
    /**
     asdf
     */
    @objc func release(_ nativeId: NativeId) {
        bridge.uiManager.addUIBlock { [weak self] _, _ in
            guard
                let contentManager = self?.offlineContentManagers[nativeId]
            else {
                return
            }
            contentManager.remove(listener: self!)
            self?.offlineContentManagers.removeValue(forKey: nativeId)
            self?.offlineTrackSelections.removeValue(forKey: nativeId)
        }
    }
    
    /**
     asdf
     */
    @objc func releaseLicense(_ nativeId: NativeId) {
        bridge.uiManager.addUIBlock { [weak self] _, _ in
            guard
                let holder = self?.offlineContentManagers[nativeId]
            else {
                return
            }
            
        }
    }
    
    func onOfflineError(_ event: OfflineErrorEvent, offlineContentManager: OfflineContentManager) {
        sendOfflineEvent(eventType: "onError", contentManager: offlineContentManager, body: [
            "code": event.code,
            "message": event.message
        ])
    }
    
    func onAvailableTracksFetched(_ event: AvailableTracksFetchedEvent, offlineContentManager: OfflineContentManager) {
        guard let nativeId = offlineContentManagerId(offlineContentManager) else {
            return
        }
        
        offlineTrackSelections[nativeId] = event.tracks
        
        sendOfflineEvent(eventType: "onOptionsAvailable", contentManager: offlineContentManager, body: [
            "options": RCTConvert.offlineContentOptionsJson(event.tracks),
            "state": RCTConvert.offlineStateJson(offlineContentManager.offlineState)
        ])
    }
    
    func onContentDownloadFinished(_ event: ContentDownloadFinishedEvent, offlineContentManager: OfflineContentManager) {
        sendOfflineEvent(eventType: "onCompleted", contentManager: offlineContentManager, body: [
            "state": RCTConvert.offlineStateJson(offlineContentManager.offlineState)
        ])
    }

    func onContentDownloadProgressChanged(_ event: ContentDownloadProgressChangedEvent, offlineContentManager: OfflineContentManager) {
        sendOfflineEvent(eventType: "onProgress", contentManager: offlineContentManager, body: [
            "progress": event.progress,
            "state": RCTConvert.offlineStateJson(offlineContentManager.offlineState)
        ])
    }

    func onContentDownloadSuspended(_ event: ContentDownloadSuspendedEvent, offlineContentManager: OfflineContentManager) {
        sendOfflineEvent(eventType: "onSuspended", contentManager: offlineContentManager)
    }

    func onContentDownloadResumed(_ event: ContentDownloadResumedEvent, offlineContentManager: OfflineContentManager) {
        sendOfflineEvent(eventType: "onResumed", contentManager: offlineContentManager)
    }

    func onOfflineContentLicenseRenewed(_ event: OfflineContentLicenseRenewedEvent, offlineContentManager: OfflineContentManager) {
        sendOfflineEvent(eventType: "onDrmLicenseUpdated", contentManager: offlineContentManager)
    }

    private func sendOfflineEvent(eventType: String, contentManager: OfflineContentManager) {
        sendOfflineEvent(eventType: eventType, contentManager: contentManager, body: nil)
    }
    
    private func sendOfflineEvent(eventType: String, contentManager: OfflineContentManager, body: [String: Any?]?) {
        guard let nativeId = offlineContentManagerId(contentManager) else {
            return
        }
        
        var baseEvent: [String: Any?] = [
            "nativeId": nativeId,
            "eventType": eventType,
        ]

        var extraParams = body ?? [:]

        sendEvent(withName: "BitmovinOfflineEvent", body: baseEvent.merging(extraParams) { (current, _) in current })
    }
    
    private func offlineContentManagerId(_ contentManager: OfflineContentManager) -> NativeId? {
        return offlineContentManagers.first { $0.value === contentManager }?.key
    }
}
