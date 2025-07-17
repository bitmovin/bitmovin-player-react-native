import BitmovinPlayer
import ExpoModulesCore

/**
 * Expo module for FullscreenHandler management with bidirectional communication.
 * Handles synchronous fullscreen state changes between native code and JavaScript.
 */
public class FullscreenHandlerModule: Module {
    /// In-memory mapping from `nativeId`s to `FullscreenHandlerBridge` instances.
    private var fullscreenHandlers: Registry<FullscreenHandlerBridge> = [:]

    /// ResultWaiter used for blocking thread while waiting for fullscreen state change
    private let waiter = ResultWaiter<Bool>()

    public func definition() -> ModuleDefinition {
        Name("FullscreenHandlerModule")

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

        AsyncFunction("notifyFullscreenChanged") { [weak self] (id: Int, isFullscreenEnabled: Bool) in
            self?.waiter.complete(id: id, with: isFullscreenEnabled)
        }

        AsyncFunction("setIsFullscreenActive") { [weak self] (nativeId: String, isFullscreen: Bool) in
            self?.fullscreenHandlers[nativeId]?.isFullscreenValueBox.update(isFullscreen)
        }.runOnQueue(.main)
    }

    /**
     * Retrieves the FullscreenHandlerBridge instance for the given nativeId.
     * This method maintains the same static access pattern as the legacy module.
     */
    func retrieve(_ nativeId: String) -> FullscreenHandlerBridge? {
        fullscreenHandlers[nativeId]
    }

    /**
     * Handles fullscreen enter request from native code.
     * Called by FullscreenHandlerBridge when fullscreen should be entered.
     */
    func onFullscreenRequested(nativeId: String) {
        guard let handler = retrieve(nativeId) else {
            return
        }

        let (id, wait) = waiter.make(timeout: 0.25)

        // Send event to JavaScript
        sendEvent("onEnterFullscreen", [
            "nativeId": nativeId,
            "id": id
        ])

        guard let result = wait() else {
            return
        }
        handler.isFullscreenValueBox.update(result)
    }

    /**
     * Handles fullscreen exit request from native code.
     * Called by FullscreenHandlerBridge when fullscreen should be exited.
     */
    func onFullscreenExitRequested(nativeId: String) {
        guard let handler = retrieve(nativeId) else {
            return
        }

        let (id, wait) = waiter.make(timeout: 0.25)

        // Send event to JavaScript
        sendEvent("onExitFullscreen", [
            "nativeId": nativeId,
            "id": id
        ])

        guard let result = wait() else {
            return
        }
        handler.isFullscreenValueBox.update(result)
    }
}
