import BitmovinPlayer
import ExpoModulesCore

/**
 * Expo module for NetworkConfig management with HTTP request/response preprocessing.
 * Handles bidirectional communication between native code and JavaScript for network operations.
 */
public class NetworkExpoModule: Module {
    /// In-memory mapping from `nativeId`s to `NetworkConfig` instances.
    private var networkConfigs: Registry<NetworkConfig> = [:]
    private var preprocessHttpRequestDelegateBridges: Registry<PreprocessHttpRequestDelegate> = [:]
    private var preprocessHttpRequestCompletionHandlers: Registry<(_ request: HttpRequest) -> Void> = [:]
    private var preprocessHttpResponseCompletionHandlers: Registry<(_ response: HttpResponse) -> Void> = [:]

    public func definition() -> ModuleDefinition {
        Name("NetworkExpoModule")

        AsyncFunction("initWithConfig") { (nativeId: String, config: [String: Any]) in
            guard
                self.retrieve(nativeId) == nil,
                let networkConfig = RCTConvert.networkConfig(config)
            else {
                return
            }
            self.networkConfigs[nativeId] = networkConfig
            self.initConfigBlocks(nativeId, config)
        }.runOnQueue(.main)

        AsyncFunction("destroy") { (nativeId: String) in
            self.networkConfigs.removeValue(forKey: nativeId)

            // Clean up completion handlers
            self.preprocessHttpRequestCompletionHandlers.keys.filter { $0.starts(with: nativeId) }.forEach {
                self.preprocessHttpRequestCompletionHandlers.removeValue(forKey: $0)
            }
            self.preprocessHttpRequestDelegateBridges.removeValue(forKey: nativeId)
            self.preprocessHttpResponseCompletionHandlers.keys.filter { $0.starts(with: nativeId) }.forEach {
                self.preprocessHttpResponseCompletionHandlers.removeValue(forKey: $0)
            }
        }.runOnQueue(.main)

        AsyncFunction("setPreprocessedHttpRequest") { (requestId: String, request: [String: Any]) in
            guard let completionHandler = self.preprocessHttpRequestCompletionHandlers[requestId],
                  let httpRequest = RCTConvert.httpRequest(request) else {
                return
            }

            self.preprocessHttpRequestCompletionHandlers.removeValue(forKey: requestId)
            completionHandler(httpRequest)
        }.runOnQueue(.main)

        AsyncFunction("setPreprocessedHttpResponse") { (responseId: String, response: [String: Any]) in
            guard let completionHandler = self.preprocessHttpResponseCompletionHandlers[responseId],
                  let httpResponse = RCTConvert.httpResponse(response) else {
                return
            }
            self.preprocessHttpResponseCompletionHandlers.removeValue(forKey: responseId)
            completionHandler(httpResponse)
        }.runOnQueue(.main)
    }

    /**
     * Retrieves the NetworkConfig instance for the given nativeId.
     * This method maintains the same static access pattern as the legacy module.
     */
    @objc
    func retrieve(_ nativeId: String) -> NetworkConfig? {
        networkConfigs[nativeId]
    }

    private func initConfigBlocks(_ nativeId: String, _ config: [String: Any]) {
        initPreprocessHttpRequest(nativeId, networkConfigJson: config)
        initPreprocessHttpResponse(nativeId, networkConfigJson: config)
    }

    private func initPreprocessHttpRequest(_ nativeId: String, networkConfigJson: [String: Any]) {
        guard let networkConfig = retrieve(nativeId),
              networkConfigJson["preprocessHttpRequest"] != nil else {
            return
        }
        preprocessHttpRequestDelegateBridges[nativeId] = PreprocessHttpRequestDelegateBridge(
            nativeId,
            networkExpoModule: self
        )
        networkConfig.preprocessHttpRequestDelegate = preprocessHttpRequestDelegateBridges[nativeId]
    }

    private func initPreprocessHttpResponse(_ nativeId: String, networkConfigJson: [String: Any]) {
        guard let networkConfig = retrieve(nativeId),
              networkConfigJson["preprocessHttpResponse"] != nil else {
            return
        }

        networkConfig.preprocessHttpResponse = { [weak self] type, response, completionHandler in
            self?.preprocessHttpResponseFromJS(
                nativeId: nativeId,
                type: type,
                response: response,
                completionHandler: completionHandler
            )
        }
    }

    internal func preprocessHttpRequestFromJS(
        nativeId: String,
        type: String,
        request: HttpRequest,
        completionHandler: @escaping (
            _ request: HttpRequest
        ) -> Void
    ) {
        let requestId = "\(nativeId)@\(ObjectIdentifier(request).hashValue)"
        let args: [Any] = [
            requestId,
            type,
            RCTConvert.toJson(httpRequest: request),
        ]
        preprocessHttpRequestCompletionHandlers[requestId] = completionHandler
        sendEvent("onPreprocessHttpRequest", [
            "nativeId": nativeId,
            "requestId": requestId,
            "type": type,
            "request": RCTConvert.toJson(httpRequest: request)
        ])
    }

    private func preprocessHttpResponseFromJS(
        nativeId: String,
        type: HttpRequestType,
        response: HttpResponse,
        completionHandler: @escaping (
            _ response: HttpResponse
        ) -> Void
    ) {
        let responseId = "\(nativeId)@\(ObjectIdentifier(response).hashValue)"
        let args: [Any] = [
            responseId,
            RCTConvert.toJson(httpRequestType: type),
            RCTConvert.toJson(httpResponse: response),
        ]
        preprocessHttpResponseCompletionHandlers[responseId] = completionHandler
        sendEvent("onPreprocessHttpResponse", [
            "nativeId": nativeId,
            "responseId": responseId,
            "type": RCTConvert.toJson(httpRequestType: type),
            "response": RCTConvert.toJson(httpResponse: response)
        ])
    }

    /**
     * Static access method to maintain compatibility with other modules.
     * Retrieves the NetworkConfig for the given nativeId from any NetworkExpoModule instance.
     */
    @objc
    public static func getNetworkConfig(_ nativeId: String) -> NetworkConfig? {
        // This static access pattern maintains compatibility with existing code
        // In a production implementation, we would need to maintain a global registry
        // or use dependency injection to access the module instance
        return nil // TODO: Implement global registry pattern if needed
    }
}