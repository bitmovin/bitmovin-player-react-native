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

public final class SharedCustomMessage: SharedObject {
    private let callback: CallbackScope
#if os(iOS)
    private(set) lazy var customMessageHandler: CustomMessageHandler = {
        let handler = CustomMessageHandler()
        handler.delegate = self
        return handler
    }()
#endif

    init(callback: CallbackScope) {
        self.callback = callback
        super.init()
    }

    public func receivedSynchronousMessage(_ message: String, withData data: String?) -> String? {
        callback.call("synchronousMessage", arguments: [message, data.map { $0 as Any } ?? NSNull()]) as? String ?? ""
    }

    public func receivedAsynchronousMessage(_ message: String, withData data: String?) {
        callback.notify("asynchronousMessage", arguments: [message, data.map { $0 as Any } ?? NSNull()])
    }

    func destroy() { callback.close() }
    deinit { callback.close() }
    override public func sharedObjectWillRelease() { callback.close() }
}

#if os(iOS)
extension SharedCustomMessage: CustomMessageHandlerDelegate {}
#endif
