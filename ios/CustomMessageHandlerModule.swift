import BitmovinPlayer
import ExpoModulesCore
import ExpoModulesJSI

public class CustomMessageHandlerModule: Module {
    public func definition() -> ModuleDefinition {
        Name("CustomMessageHandlerModule")
        Function("create") { (callback: JavaScriptValue) in
            try SharedCustomMessage(callback: CallbackScope(callback: callback, context: appContext))
        }
        Class("CustomMessageHandler", SharedCustomMessage.self) {
            AsyncFunction("sendMessage") { (owner: SharedCustomMessage, message: String, data: String?) in
#if os(iOS)
                owner.customMessageHandler.sendMessage(message, withData: data)
#endif
            }.runOnQueue(.main)
            AsyncFunction("destroy") { (owner: SharedCustomMessage) in owner.destroy() }
        }
    }
}
