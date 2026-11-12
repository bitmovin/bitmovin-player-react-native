import BitmovinPlayer
import ExpoModulesCore
import ExpoModulesJSI

public class FullscreenHandlerModule: Module {
    public func definition() -> ModuleDefinition {
        Name("FullscreenHandlerModule")
        Class(SharedFullscreenHandler.self) {
            Constructor { (config: JavaScriptValue) in
                guard let appContext else { throw Exceptions.AppContextLost() }
                return try JavaScriptActor.assumeIsolated {
                    try SharedFullscreenHandler(config: config, context: appContext)
                }
            }

            AsyncFunction("setIsFullscreenActive") { (owner: SharedFullscreenHandler, value: Bool) in
                MainActor.assumeIsolated { owner.handler.isFullscreen = value }
            }.runOnQueue(.main)
            AsyncFunction("destroy") { (owner: SharedFullscreenHandler) in owner.destroy() }
        }
    }
}
