import BitmovinPlayer
import ExpoModulesCore
import ExpoModulesJSI
import Foundation

public final class SharedCustomMessageHandler: SharedObject {
    private weak var context: AppContext?
    private let synchronousMessage: JavaScriptRef<JavaScriptWeakObject>
    private let asynchronousMessage: JavaScriptRef<JavaScriptWeakObject>
    #if os(iOS)
        private(set) lazy var customMessageHandler: CustomMessageHandler = {
            let handler = CustomMessageHandler()
            handler.delegate = self
            return handler
        }()
    #endif

    @JavaScriptActor
    init(config: JavaScriptValue, context: AppContext) throws {
        guard let synchronousMessage = weakCallback(config, "onReceivedSynchronousMessage"),
            let asynchronousMessage = weakCallback(config, "onReceivedAsynchronousMessage")
        else {
            throw Exception(name: "InvalidArgument", description: "Missing custom-message callbacks")
        }
        self.synchronousMessage = synchronousMessage
        self.asynchronousMessage = asynchronousMessage
        self.context = context
        super.init()
    }

    public func receivedSynchronousMessage(_ message: String, withData data: String?) -> String? {
        guard let context else { return "" }
        return synchronousMessage.callBlocking(
            context, arguments: [message, data.map { $0 as Any } ?? JavaScriptValue.undefined]
        ) { try $0.asString() } ?? ""
    }

    public func receivedAsynchronousMessage(_ message: String, withData data: String?) {
        guard let context else { return }
        asynchronousMessage.emit(context, arguments: [message, data.map { $0 as Any } ?? JavaScriptValue.undefined])
    }

    func destroy() { context = nil }
    deinit { destroy() }
    override public func sharedObjectWillRelease() { destroy() }
}

#if os(iOS)
    extension SharedCustomMessageHandler: CustomMessageHandlerDelegate {}
#endif
