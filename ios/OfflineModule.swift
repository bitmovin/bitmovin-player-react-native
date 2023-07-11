
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
    
#if os(iOS)
    private var offlineContentManagerHolders: Registry<OfflineContentManagerHolder> = [:]

    /**
     Retrieves the `OfflineContentManager` instance associated with `nativeId` from the internal offline managers.
     - Parameter nativeId `OfflineContentManager` instance ID.
     - Returns: The associated `OfflineContentManager` instance or `nil`.
     */
    func retrieve(_ nativeId: NativeId) -> OfflineContentManagerHolder? {
        offlineContentManagerHolders[nativeId]
    }
#endif
    
    /**
     Creates a new `OfflineContentManager` instance inside the internal offline managers using the provided `config` object.
     - @param config `Config` object received from JS.  Should contain a sourceConfig and location.
     */
    @objc func initWithConfig(_ nativeId: NativeId, config: Any?, resolver resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
#if os(iOS)
        bridge.uiManager.addUIBlock { [weak self] _, _ in
            guard
                let self = self,
                self.offlineContentManagerHolders[nativeId] == nil,
                let config = config as? [String: Any?],
                let identifier = config["identifier"] as? String,
                let sourceConfig = RCTConvert.sourceConfig(config["sourceConfig"])
            else {
                reject("BitmovinOfflineModule", "Could not create an offline content manager", nil)
                return
            }

            do {
                let offlineContentManager = try OfflineManager.sharedInstance().offlineContentManager(for: sourceConfig, id: identifier)
                let offlineContentManagerHolder = OfflineContentManagerHolder(forManager: offlineContentManager, eventEmitter: self, nativeId: nativeId, identifier: identifier)

                self.offlineContentManagerHolders[nativeId] = offlineContentManagerHolder
                resolve(nil)
            } catch let error as NSError {
                reject("BitmovinOfflineModule", "Could not create an offline content manager", error)
            }
        }
#endif
    }

    /**
     Resolve `nativeId`'s current `OfflineSourceConfig`.
     - Parameter nativeId: Target offline module Id.
     - Parameter resolver: JS promise resolver.
     - Parameter rejecter: JS promise rejecter.
     */
    @objc func getOfflineSourceConfig(_ nativeId: NativeId, options: Any?, resolver resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
#if os(iOS)
        bridge.uiManager.addUIBlock { [weak self] _, _ in
            guard
                let self = self,
                let offlineContentManagerHolder = self.offlineContentManagerHolders[nativeId]
            else {
                reject("BitmovinOfflineModule", "Could not find the offline module instance", nil)
                return
            }

            let restrictedToAssetCache = (options as? [String: Any?])?["restrictedToAssetCache"] as? Bool ?? true
            let offlineSourceConfig = offlineContentManagerHolder.offlineContentManager.createOfflineSourceConfig(restrictedToAssetCache: restrictedToAssetCache)

            resolve(RCTConvert.toJson(sourceConfig: offlineSourceConfig))
        }
#endif
    }

    /**
     Starts the `OfflineContentManager`'s asynchronous process of fetching the `OfflineContentOptions`.
     When the options are loaded a device event will be fired where the event type is `BitmovinOfflineEvent` and the data has an event type of `onOptionsAvailable`.
     - Parameter nativeId: Target offline module Id.
     - Parameter resolver: JS promise resolver.
     - Parameter rejecter: JS promise rejecter.
     */
    @objc func getOptions(_ nativeId: NativeId, resolver resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
#if os(iOS)
        bridge.uiManager.addUIBlock { [weak self] _, _ in
            guard
                let self = self,
                let offlineContentManagerHolder = self.offlineContentManagerHolders[nativeId]
            else {
                reject("BitmovinOfflineModule", "Could not find the offline module instance", nil)
                return
            }

            offlineContentManagerHolder.offlineContentManager.fetchAvailableTracks()
            resolve(nil)
        }
#endif
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
#if os(iOS)
        bridge.uiManager.addUIBlock { [weak self] _, _ in
            guard
                let self = self,
                let offlineContentManagerHolder = self.offlineContentManagerHolders[nativeId],
                let currentTrackSelection = offlineContentManagerHolder.currentTrackSelection,
                let request = request as? [String:Any?],
                let minimumBitrate = request["minimumBitrate"] as? NSNumber,
                let audioOptionIds = request["audioOptionIds"] as? [String],
                let textOptionIds = request["textOptionIds"] as? [String]
            else {
                reject("BitmovinOfflineModule", "Invalid download request", nil)
                return
            }

            if (!audioOptionIds.isEmpty) {
                currentTrackSelection.audioTracks.forEach {
                    if (audioOptionIds.contains($0.label)) {
                        $0.action = .download
                    } else {
                        $0.action = .none
                    }
                }
            }

            if (!textOptionIds.isEmpty) {
                currentTrackSelection.textTracks.forEach {
                    if (textOptionIds.contains($0.label)) {
                        $0.action = .download
                    } else {
                        $0.action = .none
                    }
                }
            }

            let config = DownloadConfig()
            config.minimumBitrate = minimumBitrate
            offlineContentManagerHolder.offlineContentManager.download(tracks: currentTrackSelection, downloadConfig: config)
            resolve(nil)
        }
#endif
    }

    /**
     Resumes all suspended actions.
     - Parameter nativeId: Target offline module Id
     - Parameter resolver: JS promise resolver.
     - Parameter rejecter: JS promise rejecter.
     */
    @objc func resume(_ nativeId: NativeId, resolver resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
#if os(iOS)
        bridge.uiManager.addUIBlock { [weak self] _, _ in
            guard
                let self = self,
                let offlineContentManagerHolder = self.offlineContentManagerHolders[nativeId]
            else {
                reject("BitmovinOfflineModule", "Could not find the offline module instance", nil)
                return
            }

            offlineContentManagerHolder.offlineContentManager.resumeDownload()
            resolve(nil)
        }
#endif
    }

    /**
     Suspends all active actions.
     - Parameter nativeId: Target offline module Id
     - Parameter resolver: JS promise resolver.
     - Parameter rejecter: JS promise rejecter.
     */
    @objc func suspend(_ nativeId: NativeId, resolver resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
#if os(iOS)
        bridge.uiManager.addUIBlock { [weak self] _, _ in
            guard
                let self = self,
                let offlineContentManagerHolder = self.offlineContentManagerHolders[nativeId]
            else {
                reject("BitmovinOfflineModule", "Could not find the offline module instance", nil)
                return
            }

            offlineContentManagerHolder.offlineContentManager.suspendDownload()
            resolve(nil)
        }
#endif
    }

    /**
     Cancels all active downloads and removes the data.
     - Parameter nativeId: Target offline module Id
     - Parameter resolver: JS promise resolver.
     - Parameter rejecter: JS promise rejecter.
     */
    @objc func cancelDownload(_ nativeId: NativeId, resolver resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
#if os(iOS)
        bridge.uiManager.addUIBlock { [weak self] _, _ in
            guard
                let self = self,
                let offlineContentManagerHolder = self.offlineContentManagerHolders[nativeId]
            else {
                reject("BitmovinOfflineModule", "Could not find the offline module instance", nil)
                return
            }

            offlineContentManagerHolder.offlineContentManager.cancelDownload()
            resolve(nil)
        }
#endif
    }

    /**
     Deletes everything related to the related content ID.
     - Parameter nativeId: Target offline module Id
     - Parameter resolver: JS promise resolver.
     - Parameter rejecter: JS promise rejecter.
     */
    @objc func deleteAll(_ nativeId: NativeId, resolver resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
#if os(iOS)
        bridge.uiManager.addUIBlock { [weak self] _, _ in
            guard
                let self = self,
                let offlineContentManagerHolder = self.offlineContentManagerHolders[nativeId]
            else {
                reject("BitmovinOfflineModule", "Could not find the offline module instance", nil)
                return
            }

            offlineContentManagerHolder.offlineContentManager.deleteOfflineData()
            resolve(nil)
        }
#endif
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
#if os(iOS)
        bridge.uiManager.addUIBlock { [weak self] _, _ in
            guard
                let self = self,
                let offlineContentManagerHolder = self.offlineContentManagerHolders[nativeId]
            else {
                reject("BitmovinOfflineModule", "Could not find the offline module instance", nil)
                return
            }

            offlineContentManagerHolder.offlineContentManager.syncOfflineDrmLicenseInformation()
            resolve(nil)
        }
#endif
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
#if os(iOS)
        bridge.uiManager.addUIBlock { [weak self] _, _ in
            guard
                let self = self,
                let offlineContentManagerHolder = self.offlineContentManagerHolders[nativeId]
            else {
                reject("BitmovinOfflineModule", "Could not find the offline module instance", nil)
                return
            }

            offlineContentManagerHolder.offlineContentManager.renewOfflineLicense()
            resolve(nil)
        }
#endif
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
#if os(iOS)
        bridge.uiManager.addUIBlock { [weak self] _, _ in
            guard
                let self = self,
                let offlineContentManagerHolder = self.offlineContentManagerHolders[nativeId]
            else {
                reject("BitmovinOfflineModule", "Could not find the offline module instance", nil)
                return
            }

            offlineContentManagerHolder.release()
            self.offlineContentManagerHolders[nativeId] = nil
            resolve(nil)
        }
#endif
    }
}
