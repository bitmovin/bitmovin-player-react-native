import BitmovinPlayer
import ExpoModulesCore

/**
 * Expo module for FullscreenHandler management with bidirectional communication.
 * Handles synchronous fullscreen state changes between native code and JavaScript.
 */
public class FullscreenHandlerExpoModule: Module {
    /// In-memory mapping from `nativeId`s to `FullscreenHandlerBridge` instances.
    private var fullscreenHandlers: Registry<FullscreenHandlerBridge> = [:]
    
    /// Dispatch group used for blocking thread while waiting for state change
    private let fullscreenChangeDispatchGroup = DispatchGroup()

    public func definition() -> ModuleDefinition {
        Name("FullscreenHandlerExpoModule")

        AsyncFunction("registerHandler") { (nativeId: String) in
            await withCheckedContinuation { continuation in
                DispatchQueue.main.async { [weak self] in
                    guard self?.fullscreenHandlers[nativeId] == nil else {
                        continuation.resume()
                        return
                    }
                    self?.fullscreenHandlers[nativeId] = FullscreenHandlerBridge(nativeId, bridge: nil)
                    continuation.resume()
                }
            }
        }

        AsyncFunction("destroy") { (nativeId: String) in
            await withCheckedContinuation { continuation in
                DispatchQueue.main.async { [weak self] in
                    self?.fullscreenHandlers.removeValue(forKey: nativeId)
                    continuation.resume()
                }
            }
        }

        Function("onFullscreenChanged") { (nativeId: String, isFullscreenEnabled: Bool) -> Any? in
            fullscreenHandlers[nativeId]?.isFullscreen = isFullscreenEnabled
            fullscreenChangeDispatchGroup.leave()
            return nil
        }

        AsyncFunction("setIsFullscreenActive") { (nativeId: String, isFullscreen: Bool) in
            await withCheckedContinuation { continuation in
                DispatchQueue.main.async { [weak self] in
                    self?.fullscreenHandlers[nativeId]?.isFullscreen = isFullscreen
                    continuation.resume()
                }
            }
        }
    }

    /**
     * Retrieves the FullscreenHandlerBridge instance for the given nativeId.
     * This method maintains the same static access pattern as the legacy module.
     */
    @objc
    func retrieve(_ nativeId: String) -> FullscreenHandlerBridge? {
        fullscreenHandlers[nativeId]
    }

    /**
     * Handles fullscreen enter request from native code.
     * Called by FullscreenHandlerBridge when fullscreen should be entered.
     */
    func onFullscreenRequested(nativeId: String) {
        fullscreenChangeDispatchGroup.enter()
        
        // Send event to JavaScript
        sendEvent("onEnterFullscreen", [
            "nativeId": nativeId
        ])
        
        fullscreenChangeDispatchGroup.wait()
    }

    /**
     * Handles fullscreen exit request from native code.
     * Called by FullscreenHandlerBridge when fullscreen should be exited.
     */
    func onFullscreenExitRequested(nativeId: String) {
        fullscreenChangeDispatchGroup.enter()
        
        // Send event to JavaScript
        sendEvent("onExitFullscreen", [
            "nativeId": nativeId
        ])
        
        fullscreenChangeDispatchGroup.wait()
    }

    /**
     * Static access method to maintain compatibility with other modules.
     * Retrieves the FullscreenHandlerBridge for the given nativeId.
     */
    @objc
    public static func getFullscreenHandlerBridge(_ nativeId: String) -> FullscreenHandlerBridge? {
        // TODO: Implement global registry pattern if needed by other modules
        return nil
    }
}