import BitmovinPlayer
import ExpoModulesCore

public final class SharedFullscreenHandler: SharedObject {
    let handler = FullscreenHandlerBridge()
    private let callback: CallbackScope

    init(callback: CallbackScope) {
        self.callback = callback
        super.init()
        handler.owner = self
    }

    @MainActor
    func request(_ operation: String) {
        if let value = callback.call(operation, arguments: []) as? Bool {
            handler.isFullscreen = value
        }
    }

    func destroy() { callback.close() }
    deinit { callback.close() }
    override public func sharedObjectWillRelease() { callback.close() }
}

nonisolated internal class FullscreenHandlerBridge: NSObject, FullscreenHandler {
    @MainActor var isFullscreen = false
    weak var owner: SharedFullscreenHandler?

    @MainActor
    func onFullscreenRequested() { owner?.request("enterFullscreen") }
    @MainActor
    func onFullscreenExitRequested() { owner?.request("exitFullscreen") }
}
