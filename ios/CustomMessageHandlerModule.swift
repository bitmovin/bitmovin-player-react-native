import BitmovinPlayer

@objc(CustomMessageHandlerModule)
public class CustomMessageHandlerModule: NSObject, RCTBridgeModule {
    // swiftlint:disable:next implicitly_unwrapped_optional
    @objc public var bridge: RCTBridge!

    // swiftlint:disable:next implicitly_unwrapped_optional
    public static func moduleName() -> String! {
        "CustomMessageHandlerModule"
    }

    public static func requiresMainQueueSetup() -> Bool {
        true
    }

    // swiftlint:disable:next implicitly_unwrapped_optional
    public var methodQueue: DispatchQueue! {
        bridge.uiManager.methodQueue
    }

    /// In-memory mapping from `nativeId`s to `CustomMessageHandlerBridge` instances.
    private var customMessageHandlers: Registry<CustomMessageHandlerBridge> = [:]

    /// Dispatch group used for blocking thread while waiting for state change
    private let customMessageHandlerDispatchGroup = DispatchGroup()

    /**
     Fetches the `CustomMessageHandlerBridge` instance associated with `nativeId` from internal customMessageHandlers.
     - Parameter nativeId: `CustomMessageHandlerBridge` instance ID.
     - Returns: The associated `CustomMessageHandlerBridge` instance or `nil`.
     */
    @objc
    func retrieve(_ nativeId: NativeId) -> CustomMessageHandlerBridge? {
        customMessageHandlers[nativeId]
    }

    /**
     Removes the `CustomMessageHandlerBridge` instance associated with `nativeId` from `customMessageHandlers`.
     - Parameter nativeId Instance to be disposed.
     */
    @objc(destroy:)
    func destroy(_ nativeId: NativeId) {
        customMessageHandlers.removeValue(forKey: nativeId)
    }

    @objc(registerHandler:)
    func registerHandler(_ nativeId: NativeId) {
        guard customMessageHandlers[nativeId] == nil else { return }
        customMessageHandlers[nativeId] = CustomMessageHandlerBridge(nativeId, bridge: bridge)
    }

    @objc(onReceivedSynchronousMessageResult:result:)
    func onReceivedSynchronousMessageResult(_ nativeId: NativeId, result: String?) -> Any? {
        customMessageHandlers[nativeId]?.pushSynchronousResult(result)
        customMessageHandlerDispatchGroup.leave()
        return nil
    }

    @objc(sendMessage:message:data:)
    func sendMessage(nativeId: NativeId, message: String, data: String?) {
        customMessageHandlers[nativeId]?.sendMessage(message, withData: data)
    }

    func receivedSynchronousMessage(
        nativeId: NativeId,
        message: String,
        withData data: String?
    ) -> String? {
        customMessageHandlerDispatchGroup.enter()
        bridge.enqueueJSCall(
            "CustomMessageBridge-\(nativeId)",
            method: "receivedSynchronousMessage",
            args: [message, data]
        ) {}
        customMessageHandlerDispatchGroup.wait()
        return customMessageHandlers[nativeId]?.popSynchronousResult()
    }

    func receivedAsynchronousMessage(
        nativeId: NativeId,
        message: String,
        withData data: String?
    ) {
        bridge.enqueueJSCall(
            "CustomMessageBridge-\(nativeId)",
            method: "receivedAsynchronousMessage",
            args: [message, data]
        ) {}
    }
}
