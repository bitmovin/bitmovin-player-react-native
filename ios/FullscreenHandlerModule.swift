import BitmovinPlayer
import ExpoModulesCore
import ExpoModulesJSI

public class FullscreenHandlerModule: Module {
    public func definition() -> ModuleDefinition {
        Name("FullscreenHandlerModule")
        Class("SharedFullscreenHandler", SharedFullscreenHandler.self) {
            Constructor { (callback: JavaScriptValue) in
            try SharedFullscreenHandler(callback: CallbackScope(callback: callback, context: appContext))
            }

            AsyncFunction("setIsFullscreenActive") { (owner: SharedFullscreenHandler, value: Bool) in
                MainActor.assumeIsolated { owner.handler.isFullscreen = value }
            }.runOnQueue(.main)
            AsyncFunction("destroy") { (owner: SharedFullscreenHandler) in owner.destroy() }
        }
    }
}
