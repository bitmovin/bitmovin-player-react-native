import BitmovinPlayer
import ExpoModulesCore

public class SourceExpoModule: Module {
    /// In-memory mapping from `nativeId`s to `Source` instances.
    /// This must match the Registry pattern from legacy SourceModule
    private var sources: Registry<Source> = [:]

    /// In-memory mapping from `nativeId`s to `SourceConfig` instances for casting.
    private var castSourceConfigs: Registry<SourceConfig> = [:]

    public func definition() -> ModuleDefinition {
        Name("SourceExpoModule")

        OnCreate {
            // Module initialization
        }

        OnDestroy {
            // Clean up sources
            sources.removeAll()
            castSourceConfigs.removeAll()
        }

        // PHASE 1: Start with simple utility methods

        /**
         Returns the count of active sources for debugging purposes
         */
        Function("getSourceCount") {
            sources.count
        }

        /**
         Checks if a source with the given nativeId exists
         */
        Function("hasSource") { (nativeId: String) in
            sources[nativeId] != nil
        }

        /**
         Creates a new `Source` instance with the provided config.
         */
        AsyncFunction("initWithConfig") { [weak self] (nativeId: String, drmNativeId: String?, config: [String: Any]?, sourceRemoteControlConfig: [String: Any]?) -> Void in
            guard let self else { throw SourceError.moduleDestroyed }
            
            await withCheckedContinuation { (continuation: CheckedContinuation<Void, Never>) in
                DispatchQueue.main.async { [weak self] in
                    defer { continuation.resume() }
                    
                    guard let self else { return }
                    
                    if self.sources[nativeId] != nil {
                        return // Source already exists
                    }
                    
                    // Get DRM config if provided
                    let drmConfig = drmNativeId.flatMap { DrmExpoModule.retrieve($0) }
                    
                    guard let sourceConfig = RCTConvert.sourceConfig(config, drmConfig: drmConfig) else {
                        throw SourceError.invalidSourceConfig
                    }
                    
                    do {
                        let source = SourceFactory.create(from: sourceConfig)
                        self.sources[nativeId] = source
                        
                        // Store cast source config if provided
                        if sourceRemoteControlConfig != nil {
                            self.castSourceConfigs[nativeId] = sourceConfig
                        }
                    } catch {
                        throw SourceError.sourceCreationFailed(error.localizedDescription)
                    }
                }
            }
        }

        /**
         Creates a new `Source` instance with analytics configuration.
         */
        AsyncFunction("initWithAnalyticsConfig") { [weak self] (nativeId: String, drmNativeId: String?, config: [String: Any]?, sourceRemoteControlConfig: [String: Any]?, analyticsSourceMetadata: [String: Any]?) -> Void in
            guard let self else { throw SourceError.moduleDestroyed }
            
            await withCheckedContinuation { (continuation: CheckedContinuation<Void, Never>) in
                DispatchQueue.main.async { [weak self] in
                    defer { continuation.resume() }
                    
                    guard let self else { return }
                    
                    if self.sources[nativeId] != nil {
                        return // Source already exists
                    }
                    
                    // Get DRM config if provided
                    let drmConfig = drmNativeId.flatMap { DrmExpoModule.retrieve($0) }
                    
                    guard let sourceConfig = RCTConvert.sourceConfig(config, drmConfig: drmConfig) else {
                        throw SourceError.invalidSourceConfig
                    }
                    
                    // Add analytics metadata if provided
                    if let analyticsMetadata = analyticsSourceMetadata {
                        sourceConfig.analyticsSourceMetadata = RCTConvert.analyticsSourceMetadata(analyticsMetadata)
                    }
                    
                    do {
                        let source = SourceFactory.create(from: sourceConfig)
                        self.sources[nativeId] = source
                        
                        // Store cast source config if provided
                        if sourceRemoteControlConfig != nil {
                            self.castSourceConfigs[nativeId] = sourceConfig
                        }
                    } catch {
                        throw SourceError.sourceCreationFailed(error.localizedDescription)
                    }
                }
            }
        }

        /**
         Destroys the source instance with the given native ID.
         */
        AsyncFunction("destroy") { [weak self] (nativeId: String) -> Void in
            guard let self else { throw SourceError.moduleDestroyed }
            
            await withCheckedContinuation { (continuation: CheckedContinuation<Void, Never>) in
                DispatchQueue.main.async { [weak self] in
                    defer { continuation.resume() }
                    
                    guard let self else { return }
                    
                    self.sources.removeValue(forKey: nativeId)
                    self.castSourceConfigs.removeValue(forKey: nativeId)
                }
            }
        }

        /**
         Checks if the source is attached to a player.
         */
        AsyncFunction("isAttachedToPlayer") { [weak self] (nativeId: String) -> Bool? in
            guard let self else { throw SourceError.moduleDestroyed }
            
            return await withCheckedContinuation { (continuation: CheckedContinuation<Bool?, Never>) in
                DispatchQueue.main.async { [weak self] in
                    defer { continuation.resume(returning: nil) }
                    
                    guard 
                        let self,
                        let source = self.sources[nativeId]
                    else {
                        return
                    }
                    
                    // Check if source is attached to any player
                    let isAttached = source.isAttachedToPlayer
                    continuation.resume(returning: isAttached)
                }
            }
        }

        /**
         Checks if the source is currently active.
         */
        AsyncFunction("isActive") { [weak self] (nativeId: String) -> Bool? in
            guard let self else { throw SourceError.moduleDestroyed }
            
            return await withCheckedContinuation { (continuation: CheckedContinuation<Bool?, Never>) in
                DispatchQueue.main.async { [weak self] in
                    defer { continuation.resume(returning: nil) }
                    
                    guard 
                        let self,
                        let source = self.sources[nativeId]
                    else {
                        return
                    }
                    
                    let isActive = source.isActive
                    continuation.resume(returning: isActive)
                }
            }
        }

        /**
         Gets the duration of the source.
         */
        AsyncFunction("duration") { [weak self] (nativeId: String) -> Double? in
            guard let self else { throw SourceError.moduleDestroyed }
            
            return await withCheckedContinuation { (continuation: CheckedContinuation<Double?, Never>) in
                DispatchQueue.main.async { [weak self] in
                    defer { continuation.resume(returning: nil) }
                    
                    guard 
                        let self,
                        let source = self.sources[nativeId]
                    else {
                        return
                    }
                    
                    let duration = source.duration
                    continuation.resume(returning: duration)
                }
            }
        }

        /**
         Gets the loading state of the source.
         */
        AsyncFunction("loadingState") { [weak self] (nativeId: String) -> String? in
            guard let self else { throw SourceError.moduleDestroyed }
            
            return await withCheckedContinuation { (continuation: CheckedContinuation<String?, Never>) in
                DispatchQueue.main.async { [weak self] in
                    defer { continuation.resume(returning: nil) }
                    
                    guard 
                        let self,
                        let source = self.sources[nativeId]
                    else {
                        return
                    }
                    
                    let loadingState = RCTConvert.toJson(loadingState: source.loadingState)
                    continuation.resume(returning: loadingState)
                }
            }
        }
    }

    // CRITICAL: This method must remain available for cross-module access
    // Called by PlayerModule.loadSource()
    @objc
    public func retrieve(_ nativeId: NativeId) -> Source? {
        sources[nativeId]
    }

    // Fetches cast-specific `SourceConfig` by `NativeId` if exists
    public func retrieveCastSourceConfig(_ nativeId: NativeId) -> SourceConfig? {
        castSourceConfigs[nativeId]
    }
}

// MARK: - Error Definitions

enum SourceError: Error, CustomStringConvertible {
    case moduleDestroyed
    case invalidSourceConfig
    case sourceCreationFailed(String)
    
    var description: String {
        switch self {
        case .moduleDestroyed:
            return "SourceExpoModule has been destroyed"
        case .invalidSourceConfig:
            return "Invalid source configuration"
        case .sourceCreationFailed(let message):
            return "Could not create source: \(message)"
        }
    }
}
