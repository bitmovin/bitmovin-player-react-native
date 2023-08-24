
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
    @objc(initWithConfig:config:drmNativeId:resolver:rejecter:)
    func initWithConfig(
        _ nativeId: NativeId,
        config: Any?,
        drmNativeId: NativeId?,
        resolver resolve: @escaping RCTPromiseResolveBlock,
        rejecter reject: @escaping RCTPromiseRejectBlock
    ) {
#if os(iOS)
        bridge.uiManager.addUIBlock { [weak self] _, _ in
            guard
                let self = self,
                self.offlineContentManagerHolders[nativeId] == nil,
                let config = config as? [String: Any?],
                let identifier = config["identifier"] as? String
            else {
                reject("BitmovinOfflineModule", "Could not create an offline content manager", nil)
                return
            }

            let fairplayConfig = drmNativeId.flatMap { self.bridge[DrmModule.self]?.retrieve($0) }
            guard let sourceConfig = RCTConvert.sourceConfig(config["sourceConfig"], drmConfig: fairplayConfig) else {
                reject("BitmovinOfflineModule", "Invalid source config", nil)
                return
            }

            do {
                let offlineContentManager = try OfflineManager.sharedInstance()
                    .offlineContentManager(for: sourceConfig, id: identifier)
                let offlineContentManagerHolder = OfflineContentManagerHolder(
                    forManager: offlineContentManager,
                    eventEmitter: self,
                    nativeId: nativeId,
                    identifier: identifier
                )

                self.offlineContentManagerHolders[nativeId] = offlineContentManagerHolder
                resolve(nil)
            } catch let error as NSError {
                reject("BitmovinOfflineModule", "Could not create an offline content manager", error)
            }
        }
#endif
    }

    @objc(getState:resolver:rejecter:)
    func getState(
        _ nativeId: NativeId,
        resolver resolve: @escaping RCTPromiseResolveBlock,
        rejecter reject: @escaping RCTPromiseRejectBlock
    ) {
#if os(iOS)
        bridge.uiManager.addUIBlock { [weak self] _, _ in
            guard
                let self = self,
                let offlineContentManagerHolder = self.offlineContentManagerHolders[nativeId]
            else {
                reject("BitmovinOfflineModule", "Could not find the offline module instance", nil)
                return
            }

            resolve(RCTConvert.toJson(offlineState: offlineContentManagerHolder.offlineContentManager.offlineState))
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
    @objc(getOptions:resolver:rejecter:)
    func getOptions(
        _ nativeId: NativeId,
        resolver resolve: @escaping RCTPromiseResolveBlock,
        rejecter reject: @escaping RCTPromiseRejectBlock) {
#if os(iOS)
        bridge.uiManager.addUIBlock { [weak self] _, _ in
            guard
                let self = self,
                let offlineContentManagerHolder = self.offlineContentManagerHolders[nativeId]
            else {
                reject("BitmovinOfflineModule", "Could not find the offline module instance", nil)
                return
            }

            offlineContentManagerHolder.fetchAvailableTracks()
            resolve(nil)
        }
#endif
    }

    /**
     Enqueues downloads according to the `OfflineDownloadRequest`.
     * The promise will reject in the event of null or invalid request parameters.
     - Parameter nativeId: Target offline module Id
     - Parameter request: The download request js object containing the requested bitrate and track option ids to download.
     - Parameter resolver: JS promise resolver.
     - Parameter rejecter: JS promise rejecter.
     */
    @objc(download:request:resolver:rejecter:)
    func download(
        _ nativeId: NativeId,
        request: Any?,
        resolver resolve: @escaping RCTPromiseResolveBlock,
        rejecter reject: @escaping RCTPromiseRejectBlock
    ) {
#if os(iOS)
        bridge.uiManager.addUIBlock { [weak self] _, _ in
            guard
                let self = self,
                let offlineContentManagerHolder = self.offlineContentManagerHolders[nativeId]
            else {
                reject("BitmovinOfflineModule", "Could not find the offline module instance", nil)
                return
            }

            switch offlineContentManagerHolder.offlineContentManager.offlineState {
            case .downloaded:
                reject("BitmovinOfflineModule", "Download already completed", nil)
                return
            case .downloading:
                reject("BitmovinOfflineModule", "Download already in progress", nil)
                return
            case .suspended:
                reject("BitmovinOfflineModule", "Download is suspended", nil)
                return
            @unknown default:
                break
            }

            guard let request = request as? [String: Any?] else {
                reject("BitmovinOfflineModule", "Invalid download request", nil)
                return
            }

            guard
                let currentTrackSelection = offlineContentManagerHolder.currentTrackSelection
            else {
                reject("BitmovinOfflineModule", "Invalid download options", nil)
                return
            }

            if let audioOptionIds = request["audioOptionIds"] as? [String],
               !audioOptionIds.isEmpty {
                currentTrackSelection.audioTracks.forEach {
                    if audioOptionIds.contains($0.label) {
                        $0.action = .download
                    } else {
                        $0.action = .none
                    }
                }
            }

            if let textOptionIds = request["textOptionIds"] as? [String],
               !textOptionIds.isEmpty {
                currentTrackSelection.textTracks.forEach {
                    if textOptionIds.contains($0.label) {
                        $0.action = .download
                    } else {
                        $0.action = .none
                    }
                }
            }

            let config = DownloadConfig()

            if let minimumBitrate = request["minimumBitrate"] as? NSNumber {
                config.minimumBitrate = minimumBitrate
            }

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
    @objc(resume:resolver:rejecter:)
    func resume(
        _ nativeId: NativeId,
        resolver resolve: @escaping RCTPromiseResolveBlock,
        rejecter reject: @escaping RCTPromiseRejectBlock) {
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
    @objc(suspend:resolver:rejecter:)
    func suspend(
        _ nativeId: NativeId,
        resolver resolve: @escaping RCTPromiseResolveBlock,
        rejecter reject: @escaping RCTPromiseRejectBlock
    ) {
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
    @objc(cancelDownload:resolver:rejecter:)
    func cancelDownload(
        _ nativeId: NativeId,
        resolver resolve: @escaping RCTPromiseResolveBlock,
        rejecter reject: @escaping RCTPromiseRejectBlock
    ) {
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
     Resolve `nativeId`'s current `usedStorage`.
     - Parameter nativeId: Target offline module Id
     - Parameter resolver: JS promise resolver.
     - Parameter rejecter: JS promise rejecter.
     */
    @objc(usedStorage:resolver:rejecter:)
    func usedStorage(
        _ nativeId: NativeId,
        resolver resolve: @escaping RCTPromiseResolveBlock,
        rejecter reject: @escaping RCTPromiseRejectBlock
    ) {
#if os(iOS)
        bridge.uiManager.addUIBlock { [weak self] _, _ in
            guard
                let self = self,
                let offlineContentManagerHolder = self.offlineContentManagerHolders[nativeId]
            else {
                reject("BitmovinOfflineModule", "Could not find the offline module instance", nil)
                return
            }

            resolve(offlineContentManagerHolder.offlineContentManager.usedStorage)
        }
#endif
    }

    /**
     Deletes everything related to the related content ID.
     - Parameter nativeId: Target offline module Id
     - Parameter resolver: JS promise resolver.
     - Parameter rejecter: JS promise rejecter.
     */
    @objc(deleteAll:resolver:rejecter:)
    func deleteAll(
        _ nativeId: NativeId,
        resolver resolve: @escaping RCTPromiseResolveBlock,
        rejecter reject: @escaping RCTPromiseRejectBlock
    ) {
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
    @objc(donwloadLicense:resolver:rejecter:)
    func downloadLicense(
        _ nativeId: NativeId,
        resolver resolve: @escaping RCTPromiseResolveBlock,
        rejecter reject: @escaping RCTPromiseRejectBlock
    ) {
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
    @objc(renewOfflineLicense:resolver:rejecter:)
    func renewOfflineLicense(
        _ nativeId: NativeId,
        resolver resolve: @escaping RCTPromiseResolveBlock,
        rejecter reject: @escaping RCTPromiseRejectBlock
    ) {
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
    @objc(release:resolver:rejecter:)
    func release(
        _ nativeId: NativeId,
        resolver resolve: @escaping RCTPromiseResolveBlock,
        rejecter reject: @escaping RCTPromiseRejectBlock
    ) {
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

    /**
     This method is no-op on iOS.
     - Parameter nativeId: Target offline module Id
     - Parameter resolver: JS promise resolver.
     - Parameter rejecter: JS promise rejecter.
     */
    @objc(releaseLicense:resolver:rejecter:)
    func releaseLicense(
        _ nativeId: NativeId,
        resolver resolve: @escaping RCTPromiseResolveBlock,
        rejecter reject: @escaping RCTPromiseRejectBlock
    ) {
        resolve(nil)
    }
}
