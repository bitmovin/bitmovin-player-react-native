import BitmovinPlayer
import BitmovinPlayerCore
import ExpoModulesCore

/**
 * Expo module for NetworkConfig management with HTTP request/response preprocessing.
 * Handles bidirectional communication between native code and JavaScript for network operations.
 */
public class NetworkModule: Module {
    /// In-memory mapping from `nativeId`s to `NetworkConfig` instances.
    private var networkConfigs: Registry<NetworkConfig> = [:]
    private var preprocessHttpRequestCompletionHandlers: Registry<(_ request: HttpRequest) -> Void> = [:]
    private var preprocessHttpResponseCompletionHandlers: Registry<(_ response: HttpResponse) -> Void> = [:]
    /// Guards the completion handler registries: the SDK invokes the preprocessing callbacks on a background thread,
    /// while the module functions below (including the completion functions called from JS) run on other threads.
    private let completionHandlersLock = NSRecursiveLock()

    public func definition() -> ModuleDefinition {
        Name("NetworkModule")

        OnDestroy {
            networkConfigs.removeAll()
            removeCompletionHandlers()
        }

        Events(
            "onPreprocessHttpRequest",
            "onPreprocessHttpResponse"
        )

        AsyncFunction("initializeWithConfig") { [weak self] (nativeId: NativeId, config: [String: Any]) in
            guard
                self?.retrieve(nativeId) == nil,
                let networkConfig = RCTConvert.networkConfig(config)
            else {
                return
            }
            self?.networkConfigs[nativeId] = networkConfig
            self?.initConfigBlocks(nativeId, config)
        }.runOnQueue(.main)

        AsyncFunction("destroy") { [weak self] (nativeId: NativeId) in
            self?.networkConfigs.removeValue(forKey: nativeId)

            // Clean up completion handlers
            self?.removeCompletionHandlers(forNativeId: nativeId)
        }.runOnQueue(.main)

        AsyncFunction("setPreprocessedHttpRequest") { [weak self] (requestId: String, request: [String: Any]) in
            guard let httpRequest = RCTConvert.httpRequest(request),
                  let completionHandler = self?.completionHandlersLock.withLock({
                      self?.preprocessHttpRequestCompletionHandlers.removeValue(forKey: requestId)
                  }) else {
                return
            }

            completionHandler(httpRequest)
        }

        AsyncFunction("setPreprocessedHttpResponse") { [weak self] (responseId: String, response: [String: Any]) in
            guard let httpResponse = RCTConvert.httpResponse(response),
                  let completionHandler = self?.completionHandlersLock.withLock({
                      self?.preprocessHttpResponseCompletionHandlers.removeValue(forKey: responseId)
                  }) else {
                return
            }
            completionHandler(httpResponse)
        }
    }

    /// Removes the pending completion handlers of the given `nativeId`, or all of them when it is `nil`.
    private func removeCompletionHandlers(forNativeId nativeId: NativeId? = nil) {
        completionHandlersLock.withLock {
            guard let nativeId else {
                preprocessHttpRequestCompletionHandlers.removeAll()
                preprocessHttpResponseCompletionHandlers.removeAll()
                return
            }
            preprocessHttpRequestCompletionHandlers.keys.filter { $0.starts(with: nativeId) }.forEach {
                preprocessHttpRequestCompletionHandlers.removeValue(forKey: $0)
            }
            preprocessHttpResponseCompletionHandlers.keys.filter { $0.starts(with: nativeId) }.forEach {
                preprocessHttpResponseCompletionHandlers.removeValue(forKey: $0)
            }
        }
    }

    func retrieve(_ nativeId: NativeId) -> NetworkConfig? {
        networkConfigs[nativeId]
    }

    private func initConfigBlocks(_ nativeId: NativeId, _ config: [String: Any]) {
        initPreprocessHttpRequest(nativeId, networkConfigJson: config)
        initPreprocessHttpResponse(nativeId, networkConfigJson: config)
    }

    private func initPreprocessHttpRequest(_ nativeId: NativeId, networkConfigJson: [String: Any]) {
        guard let networkConfig = retrieve(nativeId),
              networkConfigJson["preprocessHttpRequest"] != nil else {
            return
        }
        networkConfig.preprocessHttpRequest = { [weak self] type, request, completionHandler in
            self?.preprocessHttpRequestFromJS(
                nativeId: nativeId,
                type: type,
                request: request,
                completionHandler: completionHandler
            )
        }
    }

    private func initPreprocessHttpResponse(_ nativeId: NativeId, networkConfigJson: [String: Any]) {
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
        nativeId: NativeId,
        type: HttpRequestType,
        request: HttpRequest,
        completionHandler: @escaping (
            _ request: HttpRequest
        ) -> Void
    ) {
        let requestId = "\(nativeId)-\(UUID().uuidString)"
        completionHandlersLock.withLock {
            preprocessHttpRequestCompletionHandlers[requestId] = completionHandler
        }
        sendEvent("onPreprocessHttpRequest", [
            "nativeId": nativeId,
            "requestId": requestId,
            "type": RCTConvert.toJson(httpRequestType: type),
            "request": RCTConvert.toJson(httpRequest: request)
        ])
    }

    private func preprocessHttpResponseFromJS(
        nativeId: NativeId,
        type: HttpRequestType,
        response: HttpResponse,
        completionHandler: @escaping (
            _ response: HttpResponse
        ) -> Void
    ) {
        let responseId = "\(nativeId)-\(UUID().uuidString)"
        completionHandlersLock.withLock {
            preprocessHttpResponseCompletionHandlers[responseId] = completionHandler
        }
        sendEvent("onPreprocessHttpResponse", [
            "nativeId": nativeId,
            "responseId": responseId,
            "type": RCTConvert.toJson(httpRequestType: type),
            "response": RCTConvert.toJson(httpResponse: response)
        ])
    }
}
