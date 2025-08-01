import BitmovinPlayer
import ExpoModulesCore

/**
 * Expo module for CustomMessageHandler management with bidirectional communication.
 * Handles synchronous and asynchronous message handling between native code and JavaScript.
 */
public class CustomMessageHandlerModule: Module {
    /// In-memory mapping from `nativeId`s to `CustomMessageHandlerBridge` instances.
    private var customMessageHandlers: Registry<CustomMessageHandlerBridge> = [:]

    /// ResultWaiter used for blocking thread while waiting for synchronous message results
    private let waiter = ResultWaiter<String?>()

    public func definition() -> ModuleDefinition {
        Name("CustomMessageHandlerModule")

        OnDestroy {
            customMessageHandlers.removeAll()
            waiter.removeAll()
        }

        Events("onReceivedSynchronousMessage", "onReceivedAsynchronousMessage")

        AsyncFunction("registerHandler") { [weak self] (nativeId: NativeId) in
            guard self?.customMessageHandlers[nativeId] == nil else {
                return
            }
            self?.customMessageHandlers[nativeId] = CustomMessageHandlerBridge(nativeId, delegate: self)
        }.runOnQueue(.main)

        AsyncFunction("destroy") { [weak self] (nativeId: NativeId) in
            self?.customMessageHandlers.removeValue(forKey: nativeId)
        }.runOnQueue(.main)

        AsyncFunction("onReceivedSynchronousMessageResult") { [weak self] (id: Int, result: String?) in
            self?.waiter.complete(id: id, with: result)
        }

        AsyncFunction("sendMessage") { [weak self] (nativeId: NativeId, message: String, data: String?) in
            self?.customMessageHandlers[nativeId]?.sendMessage(message, withData: data)
        }.runOnQueue(.main)
    }

    func retrieve(_ nativeId: NativeId) -> CustomMessageHandlerBridge? {
        customMessageHandlers[nativeId]
    }
}

extension CustomMessageHandlerModule: CustomMessageHandlerBridgeDelegate {
    /**
     * Handles synchronous message received from native code.
     * Called by CustomMessageHandlerBridge when a synchronous message is received.
     */
    func receivedSynchronousMessage(
        nativeId: NativeId,
        message: String,
        withData data: String?
    ) -> String? {
        guard customMessageHandlers[nativeId] != nil else {
            return nil
        }

        let (id, wait) = waiter.make(timeout: 0.25)

        // Send event to JavaScript
        sendEvent("onReceivedSynchronousMessage", [
            "nativeId": nativeId,
            "id": id,
            "message": message,
            "data": data
        ])

        return wait() ?? ""
    }

    func receivedAsynchronousMessage(
        nativeId: NativeId,
        message: String,
        withData data: String?
    ) {
        // Send event to JavaScript
        sendEvent("onReceivedAsynchronousMessage", [
            "nativeId": nativeId,
            "message": message,
            "data": data
        ])
    }
}
