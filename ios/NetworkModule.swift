import BitmovinPlayer
import ExpoModulesCore

/**
 * Expo module for NetworkConfig management with HTTP request/response preprocessing.
 * Handles bidirectional communication between native code and JavaScript for network operations.
 */
public class NetworkModule: Module {
    /// In-memory mapping from `nativeId`s to `NetworkConfig` instances.
    private var networkConfigs: Registry<NetworkConfig> = [:]
    private var preprocessHttpRequestDelegateBridges: Registry<PreprocessHttpRequestDelegate> = [:]
    private var preprocessHttpRequestCompletionHandlers: Registry<(_ request: HttpRequest) -> Void> = [:]
    private var preprocessHttpResponseCompletionHandlers: Registry<(_ response: HttpResponse) -> Void> = [:]

    public func definition() -> ModuleDefinition {
        Name("NetworkModule")

        AsyncFunction("initializeWithConfig") { [weak self] (nativeId: String, config: [String: Any]) in
            guard
                self?.retrieve(nativeId) == nil,
                let networkConfig = RCTConvert.networkConfig(config)
            else {
                return
            }
            self?.networkConfigs[nativeId] = networkConfig
            self?.initConfigBlocks(nativeId, config)
        }.runOnQueue(.main)

        AsyncFunction("destroy") { [weak self] (nativeId: String) in
            self?.networkConfigs.removeValue(forKey: nativeId)

            // Clean up completion handlers
            self?.preprocessHttpRequestCompletionHandlers.keys.filter { $0.starts(with: nativeId) }.forEach {
                self?.preprocessHttpRequestCompletionHandlers.removeValue(forKey: $0)
            }
            self?.preprocessHttpRequestDelegateBridges.removeValue(forKey: nativeId)
            self?.preprocessHttpResponseCompletionHandlers.keys.filter { $0.starts(with: nativeId) }.forEach {
                self?.preprocessHttpResponseCompletionHandlers.removeValue(forKey: $0)
            }
        }.runOnQueue(.main)

        AsyncFunction("setPreprocessedHttpRequest") { [weak self] (requestId: String, request: [String: Any]) in
            guard let completionHandler = self?.preprocessHttpRequestCompletionHandlers[requestId],
                  let httpRequest = RCTConvert.httpRequest(request) else {
                return
            }

            self?.preprocessHttpRequestCompletionHandlers.removeValue(forKey: requestId)
            completionHandler(httpRequest)
        }.runOnQueue(.main)

        AsyncFunction("setPreprocessedHttpResponse") { [weak self] (responseId: String, response: [String: Any]) in
            guard let completionHandler = self?.preprocessHttpResponseCompletionHandlers[responseId],
                  let httpResponse = RCTConvert.httpResponse(response) else {
                return
            }
            self?.preprocessHttpResponseCompletionHandlers.removeValue(forKey: responseId)
            completionHandler(httpResponse)
        }.runOnQueue(.main)
    }

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
        preprocessHttpResponseCompletionHandlers[responseId] = completionHandler
        sendEvent("onPreprocessHttpResponse", [
            "nativeId": nativeId,
            "responseId": responseId,
            "type": RCTConvert.toJson(httpRequestType: type),
            "response": RCTConvert.toJson(httpResponse: response)
        ])
    }
}
