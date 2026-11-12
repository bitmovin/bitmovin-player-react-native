import BitmovinPlayer
import ExpoModulesCore
import ExpoModulesJSI

public class FullscreenHandlerModule: Module {
    public func definition() -> ModuleDefinition {
        Name("FullscreenHandlerModule")
        Class(SharedFullscreenHandler.self) {
            Constructor { (config: JavaScriptValue) in
                let callback = try CallbackScope(config: config, context: appContext)
                return try SharedFullscreenHandler(config: callback.takeConfiguration() ?? [:], callback: callback)
            }

            AsyncFunction("setIsFullscreenActive") { (owner: SharedFullscreenHandler, value: Bool) in
                MainActor.assumeIsolated { owner.handler.isFullscreen = value }
            }.runOnQueue(.main)
            AsyncFunction("destroy") { (owner: SharedFullscreenHandler) in owner.destroy() }
        }
    }
}
