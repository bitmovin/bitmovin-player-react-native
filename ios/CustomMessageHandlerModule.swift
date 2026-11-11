import BitmovinPlayer
import ExpoModulesCore
import ExpoModulesJSI

public class CustomMessageHandlerModule: Module {
    public func definition() -> ModuleDefinition {
        Name("CustomMessageHandlerModule")
        Class("CustomMessageHandler", SharedCustomMessage.self) {
            Constructor { (config: [String: String], callback: JavaScriptValue) in
            try SharedCustomMessage(config: config, callback: CallbackScope(callback: callback, context: appContext))
        }

            AsyncFunction("sendMessage") { (owner: SharedCustomMessage, message: String, data: String?) in
#if os(iOS)
                owner.customMessageHandler.sendMessage(message, withData: data)
#endif
            }.runOnQueue(.main)
            AsyncFunction("destroy") { (owner: SharedCustomMessage) in owner.destroy() }
        }
    }
}
