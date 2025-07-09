import BitmovinPlayer
import ExpoModulesCore

/**
 * Expo module for CustomMessageHandler management with bidirectional communication.
 * Handles synchronous and asynchronous message handling between native code and JavaScript.
 */
public class CustomMessageHandlerExpoModule: Module {
    /// In-memory mapping from `nativeId`s to `CustomMessageHandlerBridge` instances.
    private var customMessageHandlers: Registry<CustomMessageHandlerBridge> = [:]

    /// Dispatch group used for blocking thread while waiting for state change
    private let customMessageHandlerDispatchGroup = DispatchGroup()

    public func definition() -> ModuleDefinition {
        Name("CustomMessageHandlerExpoModule")

        AsyncFunction("registerHandler") { [weak self] (nativeId: String) in
            guard self?.customMessageHandlers[nativeId] == nil else {
                return
            }
            self?.customMessageHandlers[nativeId] = CustomMessageHandlerBridge(nativeId, expoModule: self)
        }.runOnQueue(.main)

        AsyncFunction("destroy") { [weak self] (nativeId: String) in
            self?.customMessageHandlers.removeValue(forKey: nativeId)
        }.runOnQueue(.main)

        AsyncFunction("onReceivedSynchronousMessageResult") { [weak self] (nativeId: String, result: String?) in
            self?.customMessageHandlers[nativeId]?.pushSynchronousResult(result)
            self?.customMessageHandlerDispatchGroup.leave()
        }.runOnQueue(.main)

        AsyncFunction("sendMessage") { [weak self] (nativeId: String, message: String, data: String?) in
            self?.customMessageHandlers[nativeId]?.sendMessage(message, withData: data)
        }.runOnQueue(.main)
    }

    /**
     * Retrieves the CustomMessageHandlerBridge instance for the given nativeId.
     * This method maintains the same static access pattern as the legacy module.
     */
    @objc
    func retrieve(_ nativeId: String) -> CustomMessageHandlerBridge? {
        customMessageHandlers[nativeId]
    }

    /**
     * Handles synchronous message received from native code.
     * Called by CustomMessageHandlerBridge when a synchronous message is received.
     */
    func receivedSynchronousMessage(
        nativeId: String,
        message: String,
        withData data: String?
    ) -> String? {
        customMessageHandlerDispatchGroup.enter()

        // Send event to JavaScript
        sendEvent("onReceivedSynchronousMessage", [
            "nativeId": nativeId,
            "message": message,
            "data": data as Any
        ])

        customMessageHandlerDispatchGroup.wait()
        return customMessageHandlers[nativeId]?.popSynchronousResult()
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
            "data": data as Any
        ])
    }

}
