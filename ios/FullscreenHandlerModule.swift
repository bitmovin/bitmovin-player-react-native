import BitmovinPlayer

@objc(FullscreenHandlerModule)
public class FullscreenHandlerModule: NSObject, RCTBridgeModule {
    // swiftlint:disable:next implicitly_unwrapped_optional
    @objc public var bridge: RCTBridge!

    // swiftlint:disable:next implicitly_unwrapped_optional
    public static func moduleName() -> String! {
        "FullscreenHandlerModule"
    }

    public static func requiresMainQueueSetup() -> Bool {
        true
    }

    // swiftlint:disable:next implicitly_unwrapped_optional
    public var methodQueue: DispatchQueue! {
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
    @objc
    func retrieve(_ nativeId: NativeId) -> FullscreenHandlerBridge? {
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

    @MainActor
    @objc(onFullscreenChanged:isFullscreenEnabled:)
    func onFullscreenChanged(_ nativeId: NativeId, isFullscreenEnabled: Bool) -> Any? {
        fullscreenHandlers[nativeId]?.isFullscreen = isFullscreenEnabled
        fullscreenChangeDispatchGroup.leave()
        return nil
    }

    @MainActor
    @objc(registerHandler:)
    func registerHandler(_ nativeId: NativeId) {
        guard fullscreenHandlers[nativeId] == nil else { return }
        fullscreenHandlers[nativeId] = FullscreenHandlerBridge(nativeId, bridge: bridge)
    }

    @MainActor
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
