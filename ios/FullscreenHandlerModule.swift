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

    private var fullscreenActiveUpdateBuffer = LockedBox(value: [NativeId: Bool]())

    public func definition() -> ModuleDefinition {
        Name("FullscreenHandlerModule")

        OnDestroy {
            fullscreenHandlers.removeAll()
            waiter.removeAll()
            fullscreenActiveUpdateBuffer.update { value in
                value.removeAll()
            }
        }

        Events("onEnterFullscreen", "onExitFullscreen")

        AsyncFunction("registerHandler") { (nativeId: NativeId) in
            DispatchQueue.main.async { [weak self] in
                guard let self, fullscreenHandlers[nativeId] == nil else {
                    return
                }
                let handler = FullscreenHandlerBridge(
                    nativeId,
                    moduleRegistry: appContext?.moduleRegistry
                )
                if let isFullscreen = fullscreenActiveUpdateBuffer.value[nativeId] {
                    // Apply buffered value
                    handler.isFullscreenValueBox.update(isFullscreen)
                    fullscreenActiveUpdateBuffer.update { value in
                        value.removeValue(forKey: nativeId)
                    }
                }
                fullscreenHandlers[nativeId] = handler
            }
        }.runOnQueue(.main)

        AsyncFunction("destroy") { [weak self] (nativeId: NativeId) in
            self?.fullscreenHandlers.removeValue(forKey: nativeId)
            self?.fullscreenActiveUpdateBuffer.update { value in
                value.removeValue(forKey: nativeId)
            }
        }.runOnQueue(.main)

        AsyncFunction("notifyFullscreenChanged") { [weak self] (id: Int, isFullscreenEnabled: Bool) in
            self?.waiter.complete(id: id, with: isFullscreenEnabled)
        }

        AsyncFunction("setIsFullscreenActive") { [weak self] (nativeId: NativeId, isFullscreen: Bool) in
            guard let handler = self?.fullscreenHandlers[nativeId] else {
                // Buffer the value until the handler is registered
                self?.fullscreenActiveUpdateBuffer.update { value in
                    value[nativeId] = isFullscreen
                }
                return
            }
            handler.isFullscreenValueBox.update(isFullscreen)
        }.runOnQueue(.main)
    }

    func retrieve(_ nativeId: NativeId) -> FullscreenHandlerBridge? {
        fullscreenHandlers[nativeId]
    }

    /**
     * Handles fullscreen enter request from native code.
     * Called by FullscreenHandlerBridge when fullscreen should be entered.
     */
    func onFullscreenRequested(nativeId: NativeId) {
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

    func onFullscreenExitRequested(nativeId: NativeId) {
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
