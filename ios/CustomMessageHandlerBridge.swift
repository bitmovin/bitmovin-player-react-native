import BitmovinPlayer
import ExpoModulesCore

internal class CustomMessageHandlerBridge: NSObject {
#if os(iOS)
    private(set) lazy var customMessageHandler: CustomMessageHandler = {
        let customMessageHandler = CustomMessageHandler()
        customMessageHandler.delegate = self
        return customMessageHandler
    }()
#endif

    private let nativeId: NativeId
    private weak var delegate: CustomMessageHandlerBridgeDelegate?

    init(_ nativeId: NativeId, delegate: CustomMessageHandlerBridgeDelegate?) {
        self.nativeId = nativeId
        self.delegate = delegate
    }

    func receivedSynchronousMessage(_ message: String, withData data: String?) -> String? {
        delegate?.receivedSynchronousMessage(
            nativeId: nativeId,
            message: message,
            withData: data
        )
    }

    func receivedAsynchronousMessage(_ message: String, withData data: String?) {
        delegate?.receivedAsynchronousMessage(
            nativeId: nativeId,
            message: message,
            withData: data
        )
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

internal protocol CustomMessageHandlerBridgeDelegate: AnyObject {
    func receivedSynchronousMessage(nativeId: NativeId, message: String, withData data: String?) -> String?
    func receivedAsynchronousMessage(nativeId: NativeId, message: String, withData data: String?)
}
