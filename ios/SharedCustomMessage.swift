import BitmovinPlayer
import ExpoModulesCore
import Foundation

public final class SharedCustomMessage: SharedObject {
    private let callback: CallbackScope
    private let synchronousMessage: String
    private let asynchronousMessage: String
#if os(iOS)
    private(set) lazy var customMessageHandler: CustomMessageHandler = {
        let handler = CustomMessageHandler()
        handler.delegate = self
        return handler
    }()
#endif

    init(config: [String: String], callback: CallbackScope) throws {
        guard let synchronousMessage = config["synchronousMessage"],
              let asynchronousMessage = config["asynchronousMessage"] else {
            callback.close()
            throw Exception(name: "InvalidArgument", description: "Missing custom-message callbacks")
        }
        self.synchronousMessage = synchronousMessage
        self.asynchronousMessage = asynchronousMessage
        self.callback = callback
        super.init()
    }

    public func receivedSynchronousMessage(_ message: String, withData data: String?) -> String? {
        callback.call(synchronousMessage, arguments: [message, data.map { $0 as Any } ?? NSNull()]) as? String ?? ""
    }

    public func receivedAsynchronousMessage(_ message: String, withData data: String?) {
        callback.notify(asynchronousMessage, arguments: [message, data.map { $0 as Any } ?? NSNull()])
    }

    func destroy() { callback.close() }
    deinit { callback.close() }
    override public func sharedObjectWillRelease() { callback.close() }
}

#if os(iOS)
extension SharedCustomMessage: CustomMessageHandlerDelegate {}
#endif
