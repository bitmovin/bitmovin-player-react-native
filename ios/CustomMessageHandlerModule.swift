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
                owner.handler.sendMessage(message, withData: data)
            }.runOnQueue(.main)
            AsyncFunction("destroy") { (owner: SharedCustomMessage) in owner.destroy() }
        }
    }
}

public final class SharedCustomMessage: SharedObject {
    let handler = CustomMessageHandlerBridge()
    fileprivate let callback: CallbackScope

    init(callback: CallbackScope) {
        self.callback = callback
        super.init()
        handler.owner = self
    }

    func synchronousMessage(_ message: String, data: String?) -> String? {
        callback.call("synchronousMessage", arguments: [message, data.map { $0 as Any } ?? NSNull()]) as? String ?? ""
    }

    func asynchronousMessage(_ message: String, data: String?) {
        callback.notify("asynchronousMessage", arguments: [message, data.map { $0 as Any } ?? NSNull()])
    }

    func destroy() { callback.close() }
    deinit { callback.close() }
    override public func sharedObjectWillRelease() { callback.close() }
}
