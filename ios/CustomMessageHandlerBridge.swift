import BitmovinPlayer

internal class CustomMessageHandlerBridge: NSObject {
    weak var owner: SharedCustomMessage?
#if os(iOS)
    private(set) lazy var customMessageHandler: CustomMessageHandler = {
        let handler = CustomMessageHandler()
        handler.delegate = self
        return handler
    }()
#endif

    func receivedSynchronousMessage(_ message: String, withData data: String?) -> String? {
        owner?.synchronousMessage(message, data: data)
    }

    func receivedAsynchronousMessage(_ message: String, withData data: String?) {
        owner?.asynchronousMessage(message, data: data)
    }

    func sendMessage(_ message: String, withData data: String?) {
#if os(iOS)
        customMessageHandler.sendMessage(message, withData: data)
#endif
    }
}

#if os(iOS)
extension CustomMessageHandlerBridge: CustomMessageHandlerDelegate {}
#endif
