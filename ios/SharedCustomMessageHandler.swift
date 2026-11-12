import BitmovinPlayer
import ExpoModulesCore
import ExpoModulesJSI
import Foundation

public final class SharedCustomMessageHandler: SharedObject {
    private let callback: CallbackScope
    private let synchronousMessage: JavaScriptCallback
    private let asynchronousMessage: JavaScriptCallback
    #if os(iOS)
        private(set) lazy var customMessageHandler: CustomMessageHandler = {
            let handler = CustomMessageHandler()
            handler.delegate = self
            return handler
        }()
    #endif

    init(config: [String: Any], callback: CallbackScope) throws {
        guard let synchronousMessage = config["onReceivedSynchronousMessage"] as? JavaScriptCallback,
            let asynchronousMessage = config["onReceivedAsynchronousMessage"] as? JavaScriptCallback
        else {
            callback.close()
            throw Exception(name: "InvalidArgument", description: "Missing custom-message callbacks")
        }
        self.synchronousMessage = synchronousMessage
        self.asynchronousMessage = asynchronousMessage
        self.callback = callback
        super.init()
    }

    public func receivedSynchronousMessage(_ message: String, withData data: String?) -> String? {
        synchronousMessage.call(arguments: [message, data.map { $0 as Any } ?? JavaScriptValue.undefined]) as? String
            ?? ""
    }

    public func receivedAsynchronousMessage(_ message: String, withData data: String?) {
        asynchronousMessage.notify(arguments: [message, data.map { $0 as Any } ?? JavaScriptValue.undefined])
    }

    func destroy() { callback.close() }
    deinit { callback.close() }
    override public func sharedObjectWillRelease() { callback.close() }
}

#if os(iOS)
    extension SharedCustomMessageHandler: CustomMessageHandlerDelegate {}
#endif
