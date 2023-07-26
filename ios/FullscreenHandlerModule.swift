import BitmovinPlayer

@objc(FullscreenHandlerModule)
class FullscreenHandlerModule: NSObject, RCTBridgeModule {
    /// React bridge reference.
    @objc var bridge: RCTBridge!

    /// JS module name.
    static func moduleName() -> String! {
        "FullscreenHandlerModule"
    }

    /// Module requires main thread initialization.
    static func requiresMainQueueSetup() -> Bool {
        true
    }

    /// Use `UIManager.addBlock` to enqueue module methods on UI thread.
    var methodQueue: DispatchQueue! {
        bridge.uiManager.methodQueue
    }

    /// In-memory mapping from `nativeId`s to `FullscreenHandler` instances.
    private var fullscreenHandlers: Registry<FullscreenHandlerBridge> = [:]

    /// Dispatch group used for blocking thread while waiting for state change
    private let fullscreenChangeDispatchGroup = DispatchGroup()

    /**
     Fetches the `FullscreenHandlerBridge` instance associated with `nativeId` from internal fullscreenHandlers.
     - Parameter nativeId: `FullscreenHandlerBridge` instance ID.
     - Returns: The associated `FullscreenHandlerBridge` instance or `nil`.
     */
    @objc func retrieve(_ nativeId: NativeId) -> FullscreenHandlerBridge? {
        fullscreenHandlers[nativeId]
    }

    /**
     Removes the `FullscreenHandlerBridge` instance associated with `nativeId` from `fullscreenHandlers`.
     - Parameter nativeId Instance to be disposed.
     */
    @objc(destroy:)
    func destroy(_ nativeId: NativeId) {
        fullscreenHandlers.removeValue(forKey: nativeId)
    }

    @objc(onFullscreenChanged:isFullscreenEnabled:)
    func onFullscreenChanged(_ nativeId: NativeId, isFullscreenEnabled: Bool) -> Any? {
        fullscreenHandlers[nativeId]?.isFullscreen = isFullscreenEnabled
        fullscreenChangeDispatchGroup.leave()
        return nil
    }

    @objc(registerHandler:)
    func registerHandler(_ nativeId: NativeId) {
        guard fullscreenHandlers[nativeId] == nil else { return }
        fullscreenHandlers[nativeId] = FullscreenHandlerBridge(nativeId, bridge: bridge)
    }

    @objc(setIsFullscreenActive:isFullscreen:)
    func setIsFullscreenActive(_ nativeId: NativeId, isFullscreen: Bool) {
        fullscreenHandlers[nativeId]?.isFullscreen = isFullscreen
    }

    func onFullscreenRequested(nativeId: NativeId) {
        fullscreenChangeDispatchGroup.enter()
        bridge.enqueueJSCall("FullscreenBridge-\(nativeId)", method: "enterFullscreen", args: []) {}
        fullscreenChangeDispatchGroup.wait()
    }

    func onFullscreenExitRequested(nativeId: NativeId) {
        fullscreenChangeDispatchGroup.enter()
        bridge.enqueueJSCall("FullscreenBridge-\(nativeId)", method: "exitFullscreen", args: []) {}
        fullscreenChangeDispatchGroup.wait()
    }
}
