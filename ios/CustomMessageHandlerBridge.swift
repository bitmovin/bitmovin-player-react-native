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
    private weak var expoModule: CustomMessageHandlerExpoModule?

    private var currentSynchronousResult: String?

    init(_ nativeId: NativeId, expoModule: CustomMessageHandlerExpoModule?) {
        self.nativeId = nativeId
        self.expoModule = expoModule
    }

    func receivedSynchronousMessage(_ message: String, withData data: String?) -> String? {
        expoModule?.receivedSynchronousMessage(
            nativeId: nativeId,
            message: message,
            withData: data
        )
    }

    func receivedAsynchronousMessage(_ message: String, withData data: String?) {
        expoModule?.receivedAsynchronousMessage(
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

    func pushSynchronousResult(_ result: String?) {
        currentSynchronousResult = result
    }

    func popSynchronousResult() -> String? {
        let result = currentSynchronousResult
        currentSynchronousResult = nil
        return result
    }
}

#if os(iOS)
extension CustomMessageHandlerBridge: CustomMessageHandlerDelegate {}
#endif
