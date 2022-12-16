import BitmovinPlayer

class FullscreenHandlerBridge: NSObject, FullscreenHandler {
    var isFullscreen = false

    private let nativeId: NativeId
    private let bridge: RCTBridge

    init(_ nativeId: NativeId, bridge: RCTBridge) {
        self.nativeId = nativeId
        self.bridge = bridge
        super.init()
    }

    func onFullscreenRequested() {
        guard let fullscreenHandlerModule = getFullscreenHandlerModule() else {
            return
        }
        fullscreenHandlerModule.onFullscreenRequested(nativeId: nativeId)
    }

    func onFullscreenExitRequested() {
        guard let fullscreenHandlerModule = getFullscreenHandlerModule() else {
            return
        }
        fullscreenHandlerModule.onFullscreenExitRequested(nativeId: nativeId)
    }

    /// Fetches the initialized `PlayerModule` instance on RN's bridge object.
    private func getFullscreenHandlerModule() -> FullscreenHandlerModule? {
        bridge.module(for: FullscreenHandlerModule.self) as? FullscreenHandlerModule
    }
}
