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

    /**
     Retrieves the `OfflineContentManager` instance associated with `nativeId` from the internal offline managers.
     - Parameter nativeId `OfflineContentManager` instance ID.
     - Returns: The associated `OfflineContentManager` instance or `nil`.
     */
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
     Resolve `nativeId`'s current `OfflineSourceConfig`.
     - Parameter nativeId: Target offline module Id.
     - Parameter resolver: JS promise resolver.
     - Parameter rejecter: JS promise rejecter.
     */
    @objc func getOfflineSourceConfig(_ nativeId: NativeId, resolver resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
        bridge.uiManager.addUIBlock { [weak self] _, _ in
            guard
                let contentManager = self?.offlineContentManagers[nativeId]
            else {
                reject("BitmovinOfflineModule", "Could not find the offline module instance", nil)
                return
            }

            let offlineSourceConfig = contentManager.createOfflineSourceConfig(restrictedToAssetCache: true)

            resolve(RCTConvert.toJson(sourceConfig: offlineSourceConfig))
        }
    }

    /**
     Starts the `OfflineContentManager`'s asynchronous process of fetching the `OfflineContentOptions`.
     When the options are loaded a device event will be fired where the event type is `BitmovinOfflineEvent` and the data has an event type of `onOptionsAvailable`.
     - Parameter nativeId: Target offline module Id.
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
     Enqueues downloads according to the `OfflineDownloadRequest`.
     * The promise will reject in the event of null or invalid request parameters.
     - Parameter nativeId: Target offline module Id
     - Parameter request: The download request js object containing the requested bit rate and track option ids to download.
     - Parameter resolver: JS promise resolver.
     - Parameter rejecter: JS promise rejecter.
     */
    @objc func process(_ nativeId: NativeId, request: Any?, resolver resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
        bridge.uiManager.addUIBlock { [weak self] _, _ in
            guard
                let contentManager = self?.offlineContentManagers[nativeId],
                let trackSelection = self?.offlineTrackSelections[nativeId] as? OfflineTrackSelection,
                let request = request as? [String:Any?],
                let minimumBitrate = request["minimumBitrate"] as? NSNumber,
                let audioOptionIds = request["audioOptionIds"] as? [String],
                audioOptionIds.count > 0,
                let textOptionIds = request["textOptionIds"] as? [String]
            else {
                reject("BitmovinOfflineModule", "Invalid download request", nil)
                return
            }

            trackSelection.audioTracks.forEach({
                if (audioOptionIds.contains($0.label)) {
                    $0.action = .download
                } else {
                    $0.action = .none
                }
            })
            
            if (textOptionIds.count > 0) {
                trackSelection.textTracks.forEach({
                    if (textOptionIds.contains($0.label)) {
                        $0.action = .download
                    } else {
                        $0.action = .none
                    }
                })
            }
            
            var config = DownloadConfig()
            config.minimumBitrate = minimumBitrate
            contentManager.download(tracks: trackSelection, downloadConfig: config)
            resolve(nil)
        }
    }

    /**
     Resumes all suspended actions.
     - Parameter nativeId: Target offline module Id
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
     Suspends all active actions.
     - Parameter nativeId: Target offline module Id
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
     Deletes everything related to the related content ID.
     - Parameter nativeId: Target offline module Id
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
     Downloads the offline license.
     When finished successfully a device event will be fired where the event type is `BitmovinOfflineEvent` and the data has an event type of `onDrmLicenseUpdated`.
     Errors are transmitted by a device event will be fired where the event type is `BitmovinOfflineEvent` and the data has an event type of `onError`.
     - Parameter nativeId: Target offline module Id
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
     Renews the already downloaded DRM license.
     When finished successfully a device event will be fired where the event type is `BitmovinOfflineEvent` and the data has an event type of `onDrmLicenseUpdated`.
     Errors are transmitted by a device event will be fired where the event type is `BitmovinOfflineEvent` and the data has an event type of `onError`.
     - Parameter nativeId: Target offline module Id
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
     Removes the `OfflineContentManagerListener` for the `nativeId`'s offline content manager.
     IMPORTANT: Call this when the component, in which it was created, is destroyed.
     The `OfflineManager` should not be used after calling this method.
     - Parameter nativeId: Target offline module Id
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
     Called when an error occurs.
     */
    func onOfflineError(_ event: OfflineErrorEvent, offlineContentManager: OfflineContentManager) {
        sendOfflineEvent(eventType: "onError", contentManager: offlineContentManager, body: [
            "code": event.code,
            "message": event.message
        ])
    }

    /**
     Called after a getOptions or when am OfflineOptionEntry has been updated during a process call.
     */
    func onAvailableTracksFetched(_ event: AvailableTracksFetchedEvent, offlineContentManager: OfflineContentManager) {
        guard let nativeId = offlineContentManagerId(offlineContentManager) else {
            return
        }

        offlineTrackSelections[nativeId] = event.tracks

        sendOfflineEvent(eventType: "onOptionsAvailable", contentManager: offlineContentManager, body: [
            "options": RCTConvert.toJson(offlineTracks: event.tracks),
            "state": RCTConvert.toJson(offlineState: offlineContentManager.offlineState)
        ])
    }

    /**
     Called when a process call has completed.
     */
    func onContentDownloadFinished(_ event: ContentDownloadFinishedEvent, offlineContentManager: OfflineContentManager) {
        guard let nativeId = offlineContentManagerId(offlineContentManager) else {
            return
        }
        
        sendOfflineEvent(eventType: "onCompleted", contentManager: offlineContentManager, body: [
            "options": RCTConvert.toJson(offlineTracks: offlineTrackSelections[nativeId]),
            "state": RCTConvert.toJson(offlineState: offlineContentManager.offlineState)
        ])
    }

    /**
     Called when the progress for a process call changes.
     */
    func onContentDownloadProgressChanged(_ event: ContentDownloadProgressChangedEvent, offlineContentManager: OfflineContentManager) {
        sendOfflineEvent(eventType: "onProgress", contentManager: offlineContentManager, body: [
            "progress": event.progress
        ])
    }


    /**
     Called when all actions have been suspended.
     */
    func onContentDownloadSuspended(_ event: ContentDownloadSuspendedEvent, offlineContentManager: OfflineContentManager) {
        sendOfflineEvent(eventType: "onSuspended", contentManager: offlineContentManager)
    }

    /**
     Called when all actions have been resumed.
     */
    func onContentDownloadResumed(_ event: ContentDownloadResumedEvent, offlineContentManager: OfflineContentManager) {
        sendOfflineEvent(eventType: "onResumed", contentManager: offlineContentManager)
    }

    /**
     Called when the DRM license was renewed.
     */
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
