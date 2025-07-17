import BitmovinPlayer
import ExpoModulesCore

internal class FullscreenHandlerBridge: NSObject, FullscreenHandler {
    nonisolated let isFullscreenValueBox = LockedBox(value: false)

    var isFullscreen: Bool {
        isFullscreenValueBox.value
    }

    private let nativeId: NativeId
    private let moduleRegistry: ModuleRegistry?

    init(_ nativeId: NativeId, moduleRegistry: ModuleRegistry?) {
        self.nativeId = nativeId
        self.moduleRegistry = moduleRegistry
        super.init()
    }

    func onFullscreenRequested() {
        guard let fullscreenHandlerModule = getFullscreenHandlerModule() else {
            return
        }
        // We need to set the fullscreen state before notifying the module,
        fullscreenHandlerModule.onFullscreenRequested(nativeId: nativeId)
    }

    func onFullscreenExitRequested() {
        guard let fullscreenHandlerModule = getFullscreenHandlerModule() else {
            return
        }
        // We need to set the fullscreen state before notifying the module,
        fullscreenHandlerModule.onFullscreenExitRequested(nativeId: nativeId)
    }

    /// Fetches the initialized `FullscreenHandlerModule` instance on RN's bridge object.
    private func getFullscreenHandlerModule() -> FullscreenHandlerModule? {
        moduleRegistry?.get(FullscreenHandlerModule.self)
    }
}
