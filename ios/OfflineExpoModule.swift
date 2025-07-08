import BitmovinPlayer
import ExpoModulesCore
import Foundation

public class OfflineExpoModule: Module {
#if os(iOS)
    /// In-memory mapping from `nativeId`s to `OfflineContentManagerBridge` instances.
    /// This must match the Registry pattern from legacy OfflineModule
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
            // Clean up offline content managers
            offlineContentManagerBridges.removeAll()
#endif
        }

        /**
         Creates a new `OfflineContentManager` instance inside the internal offline managers using
         the provided config object.
         - Parameter config: Config object received from JS. Should contain `sourceConfig` and `identifier`.
         */
        AsyncFunction("initWithConfig") { [weak self] (nativeId: String, config: [String: Any?]?, drmNativeId: String?) -> Void in
#if os(iOS)
            guard let self else { throw OfflineError.moduleDestroyed }
            
            await withCheckedContinuation { (continuation: CheckedContinuation<Void, Never>) in
                DispatchQueue.main.async { [weak self] in
                    defer { continuation.resume() }
                    
                    guard 
                        let self,
                        self.offlineContentManagerBridges[nativeId] == nil,
                        let config = config,
                        let identifier = config["identifier"] as? String
                    else {
                        throw OfflineError.invalidConfiguration
                    }

                    // Get DRM config from DrmExpoModule if available
                    let fairplayConfig = drmNativeId.flatMap { DrmExpoModule.retrieve($0) }
                    guard let sourceConfig = RCTConvert.sourceConfig(config["sourceConfig"], drmConfig: fairplayConfig) else {
                        throw OfflineError.invalidSourceConfig
                    }

                    do {
                        let offlineContentManager = try OfflineManager.sharedInstance()
                            .offlineContentManager(for: sourceConfig, id: identifier)
                        let offlineContentManagerBridge = OfflineContentManagerBridge(
                            forManager: offlineContentManager,
                            eventEmitter: self,
                            nativeId: nativeId,
                            identifier: identifier
                        )

                        self.offlineContentManagerBridges[nativeId] = offlineContentManagerBridge
                    } catch {
                        throw OfflineError.managerCreationFailed(error.localizedDescription)
                    }
                }
            }
#else
            // No-op on platforms other than iOS
            return
#endif
        }

        /**
         Gets the current state of the `OfflineContentManager`
         */
        AsyncFunction("getState") { [weak self] (nativeId: String) -> String? in
#if os(iOS)
            guard let self else { throw OfflineError.moduleDestroyed }
            
            return await withCheckedContinuation { (continuation: CheckedContinuation<String?, Never>) in
                DispatchQueue.main.async { [weak self] in
                    defer { continuation.resume(returning: nil) }
                    
                    guard 
                        let self,
                        let offlineContentManagerBridge = self.offlineContentManagerBridges[nativeId]
                    else {
                        return
                    }

                    let state = RCTConvert.toJson(offlineState: offlineContentManagerBridge.offlineContentManager.offlineState)
                    continuation.resume(returning: state)
                }
            }
#else
            return nil
#endif
        }

        /**
         Starts the `OfflineContentManager`'s asynchronous process of fetching the `OfflineContentOptions`.
         When the options are loaded a device event will be fired where the event type is `BitmovinOfflineEvent`
         and the data has an event type of `onOptionsAvailable`.
         */
        AsyncFunction("getOptions") { [weak self] (nativeId: String) -> Void in
#if os(iOS)
            guard let self else { throw OfflineError.moduleDestroyed }
            
            await withCheckedContinuation { (continuation: CheckedContinuation<Void, Never>) in
                DispatchQueue.main.async { [weak self] in
                    defer { continuation.resume() }
                    
                    guard 
                        let self,
                        let offlineContentManagerBridge = self.offlineContentManagerBridges[nativeId]
                    else {
                        return
                    }

                    offlineContentManagerBridge.fetchAvailableTracks()
                }
            }
#else
            return
#endif
        }

        /**
         Enqueues downloads according to the `OfflineDownloadRequest`.
         */
        AsyncFunction("download") { [weak self] (nativeId: String, request: [String: Any?]?) -> Void in
#if os(iOS)
            guard let self else { throw OfflineError.moduleDestroyed }
            
            await withCheckedContinuation { (continuation: CheckedContinuation<Void, Never>) in
                DispatchQueue.main.async { [weak self] in
                    defer { continuation.resume() }
                    
                    guard 
                        let self,
                        let offlineContentManagerBridge = self.offlineContentManagerBridges[nativeId],
                        let request = request
                    else {
                        throw OfflineError.invalidRequest
                    }

                    switch offlineContentManagerBridge.offlineContentManager.offlineState {
                    case .downloaded:
                        throw OfflineError.downloadAlreadyCompleted
                    case .downloading:
                        throw OfflineError.downloadInProgress
                    case .suspended:
                        throw OfflineError.downloadSuspended
                    @unknown default:
                        break
                    }

                    guard let currentTrackSelection = offlineContentManagerBridge.currentTrackSelection else {
                        throw OfflineError.invalidDownloadOptions
                    }

                    // Configure audio tracks
                    if let audioOptionIds = request["audioOptionIds"] as? [String], !audioOptionIds.isEmpty {
                        currentTrackSelection.audioTracks.forEach {
                            if audioOptionIds.contains($0.label) {
                                $0.action = .download
                            } else {
                                $0.action = .none
                            }
                        }
                    }

                    // Configure text tracks
                    if let textOptionIds = request["textOptionIds"] as? [String], !textOptionIds.isEmpty {
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

                    offlineContentManagerBridge.offlineContentManager.download(
                        tracks: currentTrackSelection,
                        downloadConfig: config
                    )
                }
            }
#else
            return
#endif
        }

        /**
         Resumes all suspended actions.
         */
        AsyncFunction("resume") { [weak self] (nativeId: String) -> Void in
#if os(iOS)
            guard let self else { throw OfflineError.moduleDestroyed }
            
            await withCheckedContinuation { (continuation: CheckedContinuation<Void, Never>) in
                DispatchQueue.main.async { [weak self] in
                    defer { continuation.resume() }
                    
                    guard 
                        let self,
                        let offlineContentManagerBridge = self.offlineContentManagerBridges[nativeId]
                    else {
                        return
                    }

                    offlineContentManagerBridge.offlineContentManager.resumeDownload()
                }
            }
#else
            return
#endif
        }

        /**
         Suspends all active actions.
         */
        AsyncFunction("suspend") { [weak self] (nativeId: String) -> Void in
#if os(iOS)
            guard let self else { throw OfflineError.moduleDestroyed }
            
            await withCheckedContinuation { (continuation: CheckedContinuation<Void, Never>) in
                DispatchQueue.main.async { [weak self] in
                    defer { continuation.resume() }
                    
                    guard 
                        let self,
                        let offlineContentManagerBridge = self.offlineContentManagerBridges[nativeId]
                    else {
                        return
                    }

                    offlineContentManagerBridge.offlineContentManager.suspendDownload()
                }
            }
#else
            return
#endif
        }

        /**
         Cancels all active downloads and removes the data.
         */
        AsyncFunction("cancelDownload") { [weak self] (nativeId: String) -> Void in
#if os(iOS)
            guard let self else { throw OfflineError.moduleDestroyed }
            
            await withCheckedContinuation { (continuation: CheckedContinuation<Void, Never>) in
                DispatchQueue.main.async { [weak self] in
                    defer { continuation.resume() }
                    
                    guard 
                        let self,
                        let offlineContentManagerBridge = self.offlineContentManagerBridges[nativeId]
                    else {
                        return
                    }

                    offlineContentManagerBridge.offlineContentManager.cancelDownload()
                }
            }
#else
            return
#endif
        }

        /**
         Resolve `nativeId`'s current `usedStorage`.
         */
        AsyncFunction("usedStorage") { [weak self] (nativeId: String) -> Double? in
#if os(iOS)
            guard let self else { throw OfflineError.moduleDestroyed }
            
            return await withCheckedContinuation { (continuation: CheckedContinuation<Double?, Never>) in
                DispatchQueue.main.async { [weak self] in
                    defer { continuation.resume(returning: nil) }
                    
                    guard 
                        let self,
                        let offlineContentManagerBridge = self.offlineContentManagerBridges[nativeId]
                    else {
                        return
                    }

                    let storage = offlineContentManagerBridge.offlineContentManager.usedStorage
                    continuation.resume(returning: storage)
                }
            }
#else
            return nil
#endif
        }

        /**
         Deletes everything related to the related content ID.
         */
        AsyncFunction("deleteAll") { [weak self] (nativeId: String) -> Void in
#if os(iOS)
            guard let self else { throw OfflineError.moduleDestroyed }
            
            await withCheckedContinuation { (continuation: CheckedContinuation<Void, Never>) in
                DispatchQueue.main.async { [weak self] in
                    defer { continuation.resume() }
                    
                    guard 
                        let self,
                        let offlineContentManagerBridge = self.offlineContentManagerBridges[nativeId]
                    else {
                        return
                    }

                    offlineContentManagerBridge.offlineContentManager.deleteOfflineData()
                }
            }
#else
            return
#endif
        }

        /**
         Downloads the offline license.
         When finished successfully a device event will be fired where the event type is `BitmovinOfflineEvent`
         and the data has an event type of `onDrmLicenseUpdated`.
         */
        AsyncFunction("downloadLicense") { [weak self] (nativeId: String) -> Void in
#if os(iOS)
            guard let self else { throw OfflineError.moduleDestroyed }
            
            await withCheckedContinuation { (continuation: CheckedContinuation<Void, Never>) in
                DispatchQueue.main.async { [weak self] in
                    defer { continuation.resume() }
                    
                    guard 
                        let self,
                        let offlineContentManagerBridge = self.offlineContentManagerBridges[nativeId]
                    else {
                        return
                    }

                    offlineContentManagerBridge.offlineContentManager.syncOfflineDrmLicenseInformation()
                }
            }
#else
            return
#endif
        }

        /**
         Renews the already downloaded DRM license.
         When finished successfully a device event will be fired where the event type is `BitmovinOfflineEvent`
         and the data has an event type of `onDrmLicenseUpdated`.
         */
        AsyncFunction("renewOfflineLicense") { [weak self] (nativeId: String) -> Void in
#if os(iOS)
            guard let self else { throw OfflineError.moduleDestroyed }
            
            await withCheckedContinuation { (continuation: CheckedContinuation<Void, Never>) in
                DispatchQueue.main.async { [weak self] in
                    defer { continuation.resume() }
                    
                    guard 
                        let self,
                        let offlineContentManagerBridge = self.offlineContentManagerBridges[nativeId]
                    else {
                        return
                    }

                    offlineContentManagerBridge.offlineContentManager.renewOfflineLicense()
                }
            }
#else
            return
#endif
        }

        /**
         This method is no-op on iOS.
         */
        AsyncFunction("releaseLicense") { (nativeId: String) -> Void in
            // No-op on iOS - maintained for cross-platform compatibility
            return
        }

        /**
         Removes the `OfflineContentManagerListener` for the `nativeId`'s offline content manager.
         IMPORTANT: Call this when the component, in which it was created, is destroyed.
         The `OfflineManager` should not be used after calling this method.
         */
        AsyncFunction("release") { [weak self] (nativeId: String) -> Void in
#if os(iOS)
            guard let self else { throw OfflineError.moduleDestroyed }
            
            await withCheckedContinuation { (continuation: CheckedContinuation<Void, Never>) in
                DispatchQueue.main.async { [weak self] in
                    defer { continuation.resume() }
                    
                    guard 
                        let self,
                        let offlineContentManagerBridge = self.offlineContentManagerBridges[nativeId]
                    else {
                        return
                    }

                    offlineContentManagerBridge.release()
                    self.offlineContentManagerBridges[nativeId] = nil
                }
            }
#else
            return
#endif
        }
    }

    // CRITICAL: This method must remain available for cross-module access
    // Called by other modules that need access to offline content managers
    @objc
    public static func retrieve(_ nativeId: NativeId) -> OfflineContentManagerBridge? {
#if os(iOS)
        // Implementation would need access to the singleton instance
        // This pattern needs to be addressed in a separate architectural improvement
        return nil
#else
        return nil
#endif
    }
}

// MARK: - Event Emission Support

extension OfflineExpoModule {
    /// Sends events to JavaScript layer using Expo's event system
    func sendEvent(name: String, body: [String: Any?]) {
        sendEvent("BitmovinOfflineEvent", body)
    }
}

// MARK: - Error Definitions

enum OfflineError: Error, CustomStringConvertible {
    case moduleDestroyed
    case invalidConfiguration
    case invalidSourceConfig
    case invalidRequest
    case invalidDownloadOptions
    case downloadAlreadyCompleted
    case downloadInProgress
    case downloadSuspended
    case managerCreationFailed(String)
    
    var description: String {
        switch self {
        case .moduleDestroyed:
            return "OfflineExpoModule has been destroyed"
        case .invalidConfiguration:
            return "Invalid configuration parameters"
        case .invalidSourceConfig:
            return "Invalid source configuration"
        case .invalidRequest:
            return "Invalid download request"
        case .invalidDownloadOptions:
            return "Invalid download options"
        case .downloadAlreadyCompleted:
            return "Download already completed"
        case .downloadInProgress:
            return "Download already in progress"
        case .downloadSuspended:
            return "Download is suspended"
        case .managerCreationFailed(let message):
            return "Could not create offline content manager: \(message)"
        }
    }
}