import BitmovinPlayer
import ExpoModulesCore
import ExpoModulesJSI

public class FullscreenHandlerModule: Module {
    public func definition() -> ModuleDefinition {
        Name("FullscreenHandlerModule")
        Function("create") { (callback: JavaScriptValue) in
            try SharedFullscreen(callback: CallbackScope(callback: callback, context: appContext))
        }
        Class("FullscreenHandler", SharedFullscreen.self) {
            AsyncFunction("setIsFullscreenActive") { (owner: SharedFullscreen, value: Bool) in
                MainActor.assumeIsolated { owner.handler.isFullscreen = value }
            }.runOnQueue(.main)
            AsyncFunction("destroy") { (owner: SharedFullscreen) in owner.destroy() }
        }
    }
}

public final class SharedFullscreen: SharedObject {
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
