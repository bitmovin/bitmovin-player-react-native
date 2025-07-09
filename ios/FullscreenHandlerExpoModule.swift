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

        Events("onEnterFullscreen", "onExitFullscreen")

        AsyncFunction("registerHandler") { (nativeId: String) in
            DispatchQueue.main.async { [weak self] in
                guard let self, self.fullscreenHandlers[nativeId] == nil else {
                    return
                }
                self.fullscreenHandlers[nativeId] = FullscreenHandlerBridge(
                    nativeId,
                    moduleRegistry: appContext?.moduleRegistry
                )
            }
        }.runOnQueue(.main)

        AsyncFunction("destroy") { [weak self] (nativeId: String) in
            self?.fullscreenHandlers.removeValue(forKey: nativeId)
        }.runOnQueue(.main)

        AsyncFunction("notifyFullscreenChanged") { (nativeId: String, isFullscreenEnabled: Bool) -> Any? in
            DispatchQueue.main.async { [weak self] in
                guard let self else { return }
                self.fullscreenHandlers[nativeId]?.isFullscreen = isFullscreenEnabled
                self.fullscreenChangeDispatchGroup.leave()
            }
            return nil
        }

        AsyncFunction("setIsFullscreenActive") { (nativeId: String, isFullscreen: Bool, promise: Promise) in
            DispatchQueue.main.async { [weak self] in
                guard let self else { return }
                self.fullscreenHandlers[nativeId]?.isFullscreen = isFullscreen
                promise.resolve()
            }
        }.runOnQueue(.main)
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

//        fullscreenChangeDispatchGroup.wait()
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

//        fullscreenChangeDispatchGroup.wait()
    }
}
