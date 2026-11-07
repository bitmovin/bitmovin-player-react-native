import BitmovinPlayer

nonisolated internal class FullscreenHandlerBridge: NSObject, FullscreenHandler {
    nonisolated let isFullscreenValueBox = LockedBox(value: false)
    weak var owner: SharedFullscreen?

    var isFullscreen: Bool { isFullscreenValueBox.value }
    func onFullscreenRequested() { owner?.request("enterFullscreen") }
    func onFullscreenExitRequested() { owner?.request("exitFullscreen") }
}
