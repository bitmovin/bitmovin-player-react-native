import BitmovinPlayer

class CustomMessageHandlerBridge: NSObject, CustomMessageHandlerDelegate {
    private(set) lazy var customMessageHandler: CustomMessageHandler = {
        let customMessageHandler = CustomMessageHandler()
        customMessageHandler.delegate = self
        return customMessageHandler
    }()

    private let nativeId: NativeId
    private let bridge: RCTBridge

    private var currentSynchronousResult: String?

    init(_ nativeId: NativeId, bridge: RCTBridge) {
        self.nativeId = nativeId
        self.bridge = bridge
        super.init()
    }

    func receivedSynchronousMessage(_ message: String, withData data: String?) -> String? {
        bridge[CustomMessageHandlerModule.self]?.receivedSynchronousMessage(nativeId: nativeId, message: message, withData: data)
    }

    func receivedAsynchronousMessage(_ message: String, withData data: String?) {
        bridge[CustomMessageHandlerModule.self]?.receivedAsynchronousMessage(nativeId: nativeId, message: message, withData: data)
    }

    func sendMessage(_ message: String, withData data: String?) {
        customMessageHandler.sendMessage(message, withData: data)
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
