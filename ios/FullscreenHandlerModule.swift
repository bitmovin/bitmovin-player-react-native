import BitmovinPlayer
import ExpoModulesCore
import ExpoModulesJSI

public class FullscreenHandlerModule: Module {
    public func definition() -> ModuleDefinition {
        Name("FullscreenHandlerModule")
        Class("FullscreenHandler", SharedFullscreen.self) {
            Constructor { (callback: JavaScriptValue) in
            try SharedFullscreen(callback: CallbackScope(callback: callback, context: appContext))
            }

            AsyncFunction("setIsFullscreenActive") { (owner: SharedFullscreen, value: Bool) in
                MainActor.assumeIsolated { owner.handler.isFullscreen = value }
            }.runOnQueue(.main)
            AsyncFunction("destroy") { (owner: SharedFullscreen) in owner.destroy() }
        }
    }
}
