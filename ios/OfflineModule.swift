import Foundation
import BitmovinPlayer

@objc(OfflineModule)
class OfflineModule: RCTEventEmitter {

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

    private var offlineManagerHolders: Registry<OfflineManagerHolder> = [:]

    /**
     Retrieves the `OfflineContentManager` instance associated with `nativeId` from the internal offline managers.
     - Parameter nativeId `OfflineContentManager` instance ID.
     - Returns: The associated `OfflineContentManager` instance or `nil`.
     */
    func retrieve(_ nativeId: NativeId) -> OfflineManagerHolder? {
        offlineManagerHolders[nativeId]
    }

    /**
     Creates a new `OfflineContentManager` instance inside the internal offline managers using the provided `config` object.
     - @param config `Config` object received from JS.  Should contain a sourceConfig and location.
     */
    @objc func initWithConfig(_ nativeId: NativeId, config: Any?, resolver resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
        bridge.uiManager.addUIBlock { [weak self] _, _ in
            guard
                self?.offlineManagerHolders[nativeId] == nil,
                let config = config as? [String: Any?],
                let offlineId = config["offlineId"] as? String,
                let sourceConfig = RCTConvert.sourceConfig(config["sourceConfig"])
            else {
                reject("BitmovinOfflineModule", "Could not create an offline content manager", nil)
                return
            }
            
            do {
                let contentManager = try OfflineManager.sharedInstance().offlineContentManager(for: sourceConfig, id: offlineId)
                let managerHolder = OfflineManagerHolder(forManager: contentManager, eventEmitter: self!, nativeId: nativeId, offlineId: offlineId)

                self?.offlineManagerHolders[nativeId] = managerHolder
            } catch let error as NSError {
                reject("BitmovinOfflineModule", "Could not create an offline content manager", error)
            }
            
            resolve(nil)
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
                let managerHolder = self?.offlineManagerHolders[nativeId]
            else {
                reject("BitmovinOfflineModule", "Could not find the offline module instance", nil)
                return
            }

            let offlineSourceConfig = managerHolder.contentManager.createOfflineSourceConfig(restrictedToAssetCache: true)

            resolve(RCTConvert.toJson(sourceConfig: offlineSourceConfig))
        }
    }

    /**
     Starts the `OfflineContentManager`'s asynchronous process of fetching the `OfflineContentOptions`.
     When the options are loaded a device event will be fired where the event type is `BitmovinOfflineEvent` and the data has an event type of `onOptionsAvailable`.
     - Parameter nativeId: Target offline module Id.
     - Parameter resolver: JS promise resolver.
     - Parameter rejecter: JS promise rejecter.
     */
    @objc func getOptions(_ nativeId: NativeId, resolver resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
        bridge.uiManager.addUIBlock { [weak self] _, _ in
            guard
                let managerHolder = self?.offlineManagerHolders[nativeId]
            else {
                resolve(nil)
                return
            }
            
            managerHolder.contentManager.fetchAvailableTracks()
            resolve(nil)
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
                let managerHolder = self?.offlineManagerHolders[nativeId],
                let trackSelection = managerHolder.trackSelection,
                let request = request as? [String:Any?],
                let minimumBitrate = request["minimumBitrate"] as? NSNumber,
                let audioOptionIds = request["audioOptionIds"] as? [String],
                let textOptionIds = request["textOptionIds"] as? [String]
            else {
                reject("BitmovinOfflineModule", "Invalid download request", nil)
                return
            }

            if (audioOptionIds.count > 0) {
                trackSelection.audioTracks.forEach({
                    if (audioOptionIds.contains($0.label)) {
                        $0.action = .download
                    } else {
                        $0.action = .none
                    }
                })
            }
            
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
            managerHolder.contentManager.download(tracks: trackSelection, downloadConfig: config)
            resolve(nil)
        }
    }

    /**
     Resumes all suspended actions.
     - Parameter nativeId: Target offline module Id
     - Parameter resolver: JS promise resolver.
     - Parameter rejecter: JS promise rejecter.
     */
    @objc func resume(_ nativeId: NativeId, resolver resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
        bridge.uiManager.addUIBlock { [weak self] _, _ in
            guard
                let managerHolder = self?.offlineManagerHolders[nativeId]
            else {
                resolve(nil)
                return
            }
            
            managerHolder.contentManager.resumeDownload()
            resolve(nil)
        }
    }

    /**
     Suspends all active actions.
     - Parameter nativeId: Target offline module Id
     - Parameter resolver: JS promise resolver.
     - Parameter rejecter: JS promise rejecter.
     */
    @objc func suspend(_ nativeId: NativeId, resolver resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
        bridge.uiManager.addUIBlock { [weak self] _, _ in
            guard
                let managerHolder = self?.offlineManagerHolders[nativeId]
            else {
                resolve(nil)
                return
            }
            
            managerHolder.contentManager.suspendDownload()
            resolve(nil)
        }
    }
    
    /**
     Cancels all active downloads and removes the data.
     - Parameter nativeId: Target offline module Id
     - Parameter resolver: JS promise resolver.
     - Parameter rejecter: JS promise rejecter.
     */
    @objc func cancelDownload(_ nativeId: NativeId, resolver resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
        bridge.uiManager.addUIBlock { [weak self] _, _ in
            guard
                let managerHolder = self?.offlineManagerHolders[nativeId]
            else {
                resolve(nil)
                return
            }
            
            managerHolder.contentManager.cancelDownload()
            resolve(nil)
        }
    }

    /**
     Deletes everything related to the related content ID.
     - Parameter nativeId: Target offline module Id
     - Parameter resolver: JS promise resolver.
     - Parameter rejecter: JS promise rejecter.
     */
    @objc func deleteAll(_ nativeId: NativeId, resolver resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
        bridge.uiManager.addUIBlock { [weak self] _, _ in
            guard
                let managerHolder = self?.offlineManagerHolders[nativeId]
            else {
                resolve(nil)
                return
            }
            
            managerHolder.contentManager.deleteOfflineData()
            resolve(nil)
        }
    }

    /**
     Downloads the offline license.
     When finished successfully a device event will be fired where the event type is `BitmovinOfflineEvent` and the data has an event type of `onDrmLicenseUpdated`.
     Errors are transmitted by a device event will be fired where the event type is `BitmovinOfflineEvent` and the data has an event type of `onError`.
     - Parameter nativeId: Target offline module Id
     - Parameter resolver: JS promise resolver.
     - Parameter rejecter: JS promise rejecter.
     */
    @objc func downloadLicense(_ nativeId: NativeId, resolver resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
        bridge.uiManager.addUIBlock { [weak self] _, _ in
            guard
                let managerHolder = self?.offlineManagerHolders[nativeId]
            else {
                resolve(nil)
                return
            }
            
            managerHolder.contentManager.syncOfflineDrmLicenseInformation()
            resolve(nil)
        }
    }

    /**
     Renews the already downloaded DRM license.
     When finished successfully a device event will be fired where the event type is `BitmovinOfflineEvent` and the data has an event type of `onDrmLicenseUpdated`.
     Errors are transmitted by a device event will be fired where the event type is `BitmovinOfflineEvent` and the data has an event type of `onError`.
     - Parameter nativeId: Target offline module Id
     - Parameter resolver: JS promise resolver.
     - Parameter rejecter: JS promise rejecter.
     */
    @objc func renewOfflineLicense(_ nativeId: NativeId, resolver resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
        bridge.uiManager.addUIBlock { [weak self] _, _ in
            guard
                let managerHolder = self?.offlineManagerHolders[nativeId]
            else {
                resolve(nil)
                return
            }
            
            managerHolder.contentManager.renewOfflineLicense()
            resolve(nil)
        }
    }

    /**
     Removes the `OfflineContentManagerListener` for the `nativeId`'s offline content manager.
     IMPORTANT: Call this when the component, in which it was created, is destroyed.
     The `OfflineManager` should not be used after calling this method.
     - Parameter nativeId: Target offline module Id
     - Parameter resolver: JS promise resolver.
     - Parameter rejecter: JS promise rejecter.     
     */
    @objc func release(_ nativeId: NativeId, resolver resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
        bridge.uiManager.addUIBlock { [weak self] _, _ in
            guard
                let managerHolder = self?.offlineManagerHolders[nativeId]
            else {
                resolve(nil)
                return
            }
            
            managerHolder.release()
            self?.offlineManagerHolders[nativeId] = nil
            resolve(nil)
        }
    }
}
