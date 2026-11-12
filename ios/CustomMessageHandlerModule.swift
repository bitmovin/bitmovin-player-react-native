import BitmovinPlayer
import ExpoModulesCore
import ExpoModulesJSI

public class CustomMessageHandlerModule: Module {
    public func definition() -> ModuleDefinition {
        Name("CustomMessageHandlerModule")
        Class("SharedCustomMessageHandler", SharedCustomMessageHandler.self) {
            Constructor { (config: [String: String], callback: JavaScriptValue) in
                try SharedCustomMessageHandler(
                    config: config,
                    callback: CallbackScope(callback: callback, context: appContext)
                )
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
