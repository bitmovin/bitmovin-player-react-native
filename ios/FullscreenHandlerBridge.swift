import BitmovinPlayer

nonisolated internal class FullscreenHandlerBridge: NSObject, FullscreenHandler {
    @MainActor var isFullscreen = false
    weak var owner: SharedFullscreen?

    @MainActor
    func onFullscreenRequested() { owner?.request("enterFullscreen") }
    @MainActor
    func onFullscreenExitRequested() { owner?.request("exitFullscreen") }
}
