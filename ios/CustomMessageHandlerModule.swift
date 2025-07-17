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

        Events("onReceivedSynchronousMessage", "onReceivedAsynchronousMessage")

        AsyncFunction("registerHandler") { [weak self] (nativeId: String) in
            guard self?.customMessageHandlers[nativeId] == nil else {
                return
            }
            self?.customMessageHandlers[nativeId] = CustomMessageHandlerBridge(nativeId, delegate: self)
        }.runOnQueue(.main)

        AsyncFunction("destroy") { [weak self] (nativeId: String) in
            self?.customMessageHandlers.removeValue(forKey: nativeId)
        }.runOnQueue(.main)

        AsyncFunction("onReceivedSynchronousMessageResult") { [weak self] (id: Int, result: String?) in
            self?.waiter.complete(id: id, with: result)
        }

        AsyncFunction("sendMessage") { [weak self] (nativeId: String, message: String, data: String?) in
            self?.customMessageHandlers[nativeId]?.sendMessage(message, withData: data)
        }.runOnQueue(.main)
    }

    /**
     * Retrieves the CustomMessageHandlerBridge instance for the given nativeId.
     * This method maintains the same static access pattern as the legacy module.
     */
    func retrieve(_ nativeId: String) -> CustomMessageHandlerBridge? {
        customMessageHandlers[nativeId]
    }
}

extension CustomMessageHandlerModule: CustomMessageHandlerBridgeDelegate {
    /**
     * Handles synchronous message received from native code.
     * Called by CustomMessageHandlerBridge when a synchronous message is received.
     */
    func receivedSynchronousMessage(
        nativeId: String,
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

    /**
     * Handles asynchronous message received from native code.
     * Called by CustomMessageHandlerBridge when an asynchronous message is received.
     */
    func receivedAsynchronousMessage(
        nativeId: String,
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
