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
