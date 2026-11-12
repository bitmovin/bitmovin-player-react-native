import BitmovinPlayer
import ExpoModulesCore
import ExpoModulesJSI

public class CustomMessageHandlerModule: Module {
    public func definition() -> ModuleDefinition {
        Name("CustomMessageHandlerModule")
        Class(SharedCustomMessageHandler.self) {
            Constructor { (config: JavaScriptValue) in
                let callback = try CallbackScope(config: config, context: appContext)
                return try SharedCustomMessageHandler(config: callback.takeConfiguration() ?? [:], callback: callback)
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
