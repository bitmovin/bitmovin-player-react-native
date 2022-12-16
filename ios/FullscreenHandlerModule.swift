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

    private var fullscreenChangeDispatchGroup: DispatchGroup? = DispatchGroup()

    /**
     Creates a new `FullscreenHandlerBridge` instance inside the internal fullscreenHandler using the provided `config` object.
     - Parameter nativeId: ID to associate with the `FullscreenHandlerBridge` instance.
     - Returns: The associated `FullscreenHandlerBridge` instance or `nil`.
     */
    @objc func retrieve(_ nativeId: NativeId) -> FullscreenHandlerBridge? {
        fullscreenHandlers[nativeId]
    }

    /**
     Removes the `FullscreenHandlerBridge` instance associated with `nativeId` from `fullscreenHandlers` and all data produced during preparation hooks.
     - Parameter nativeId Instance to be disposed.
     */
    @objc(destroy:)
    func destroy(_ nativeId: NativeId) {
        fullscreenHandlers.removeValue(forKey: nativeId)
    }

    @objc(onFullscreenChanged:isFullscreenEnabled:)
    func onFullscreenChanged(_ nativeId: NativeId, isFullscreenEnabled: Bool) -> Any? {
        fullscreenHandlers[nativeId]?.isFullscreen = isFullscreenEnabled

        fullscreenChangeDispatchGroup?.leave()

        return nil
    }

    @objc(registerHandler:)
    func registerHandler(_ nativeId: NativeId) {
        guard fullscreenHandlers[nativeId] == nil else { return }
        fullscreenHandlers[nativeId] = FullscreenHandlerBridge(nativeId, bridge: bridge)
    }

    func onFullscreenRequested(nativeId: NativeId) {
        fullscreenChangeDispatchGroup?.enter()

        bridge.enqueueJSCall("bmFullscreenBridge-\(nativeId)", method: "enterFullscreen", args: []) {}

        fullscreenChangeDispatchGroup?.wait()
//        fullscreenChangeDispatchGroup = nil
    }

    func onFullscreenExitRequested(nativeId: NativeId) {
        fullscreenChangeDispatchGroup?.enter()

        bridge.enqueueJSCall("bmFullscreenBridge-\(nativeId)", method: "exitFullscreen", args: []) {}

        fullscreenChangeDispatchGroup?.wait()
//        fullscreenChangeDispatchGroup = nil
    }
}
