import BitmovinPlayer
import ExpoModulesCore

public final class SharedFullscreenHandler: SharedObject {
    let handler = FullscreenHandlerBridge()
    private let callback: CallbackScope
    private let enter: JavaScriptCallback
    private let exit: JavaScriptCallback

    init(config: [String: Any], callback: CallbackScope) throws {
        guard let enter = config["enterFullscreen"] as? JavaScriptCallback,
              let exit = config["exitFullscreen"] as? JavaScriptCallback else {
            callback.close()
            throw Exception(name: "InvalidArgument", description: "Missing fullscreen callbacks")
        }
        self.enter = enter
        self.exit = exit
        self.callback = callback
        super.init()
        handler.owner = self
    }

    @MainActor
    func request(entering: Bool) {
        if let value = (entering ? enter : exit).call(arguments: []) as? Bool {
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
    func onFullscreenRequested() { owner?.request(entering: true) }
    @MainActor
    func onFullscreenExitRequested() { owner?.request(entering: false) }
}
