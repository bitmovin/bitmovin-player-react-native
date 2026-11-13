import BitmovinPlayer
import ExpoModulesCore
import ExpoModulesJSI

public final class SharedFullscreenHandler: SharedObject {
    let handler = FullscreenHandlerBridge()
    private weak var context: AppContext?
    private let enter: JavaScriptRef<JavaScriptWeakObject>
    private let exit: JavaScriptRef<JavaScriptWeakObject>

    @JavaScriptActor
    init(config: JavaScriptValue, context: AppContext) throws {
        guard let enter = weakCallback(config, "enterFullscreen"),
              let exit = weakCallback(config, "exitFullscreen") else {
            throw Exception(name: "InvalidArgument", description: "Missing fullscreen callbacks")
        }
        self.enter = enter
        self.exit = exit
        self.context = context
        super.init()
        handler.owner = self
    }

    @MainActor
    func request(entering: Bool) {
        guard let context else { return }
        if let value = (entering ? enter : exit).callBlocking(context, arguments: [], convert: { try $0.asBool() }) {
            handler.isFullscreen = value
        }
    }

    func destroy() { context = nil }
    deinit { destroy() }
    override public func sharedObjectWillRelease() { destroy() }
}

nonisolated internal class FullscreenHandlerBridge: NSObject, FullscreenHandler {
    @MainActor var isFullscreen = false
    weak var owner: SharedFullscreenHandler?

    @MainActor
    func onFullscreenRequested() { owner?.request(entering: true) }
    @MainActor
    func onFullscreenExitRequested() { owner?.request(entering: false) }
}
