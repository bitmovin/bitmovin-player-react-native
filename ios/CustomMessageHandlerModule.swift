import BitmovinPlayer
import ExpoModulesCore
import ExpoModulesJSI

public class CustomMessageHandlerModule: Module {
    public func definition() -> ModuleDefinition {
        Name("CustomMessageHandlerModule")
        Class(SharedCustomMessageHandler.self) {
            Constructor { (config: JavaScriptValue) in
                guard let appContext else { throw Exceptions.AppContextLost() }
                return try JavaScriptActor.assumeIsolated {
                    try SharedCustomMessageHandler(config: config, context: appContext)
                }
            }

            AsyncFunction("sendMessage") { (owner: SharedCustomMessageHandler, message: String, data: String?) in
#if os(iOS)
                owner.customMessageHandler.sendMessage(message, withData: data)
#endif
            }.runOnQueue(.main)
            AsyncFunction("destroy") { (owner: SharedCustomMessageHandler) in owner.destroy() }
        }
    }
}
