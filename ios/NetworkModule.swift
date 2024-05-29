import BitmovinPlayer

@objc(NetworkModule)
public class NetworkModule: NSObject, RCTBridgeModule {
    // swiftlint:disable:next implicitly_unwrapped_optional
    @objc public var bridge: RCTBridge!

    /// In-memory mapping from `nativeId`s to `NetworkConfig` instances.
    private var networkConfigs: Registry<NetworkConfig> = [:]
    private var preprocessHttpRequestDelegateBridges: Registry<PreprocessHttpRequestDelegate> = [:]
    private var preprocessHttpRequestCompletionHandlers: Registry<(_ response: HttpRequest) -> Void> = [:]
    private var preprocessHttpResponseCompletionHandlers: Registry<(_ response: HttpResponse) -> Void> = [:]

    // swiftlint:disable:next implicitly_unwrapped_optional
    public static func moduleName() -> String! {
        "NetworkModule"
    }

    public static func requiresMainQueueSetup() -> Bool {
        true
    }

    // swiftlint:disable:next implicitly_unwrapped_optional
    public var methodQueue: DispatchQueue! {
        bridge.uiManager.methodQueue
    }

    @objc
    func retrieve(_ nativeId: NativeId) -> NetworkConfig? {
        networkConfigs[nativeId]
    }

    @objc(initWithConfig:config:)
    func initWithConfig(_ nativeId: NativeId, config: Any?) {
        bridge.uiManager.addUIBlock { [weak self] _, _ in
            guard
                self?.retrieve(nativeId) == nil,
                let networkConfig = RCTConvert.networkConfig(config)
            else {
                return
            }
            self?.networkConfigs[nativeId] = networkConfig
            self?.initConfigBlocks(nativeId, config)
        }
    }

    @objc(destroy:)
    func destroy(_ nativeId: NativeId) {
        networkConfigs.removeValue(forKey: nativeId)

        preprocessHttpRequestCompletionHandlers.keys.filter { $0.starts(with: nativeId) }.forEach {
            preprocessHttpRequestCompletionHandlers.removeValue(forKey: $0)
        }
        preprocessHttpRequestDelegateBridges.removeValue(forKey: nativeId)
        preprocessHttpResponseCompletionHandlers.keys.filter { $0.starts(with: nativeId) }.forEach {
            preprocessHttpResponseCompletionHandlers.removeValue(forKey: $0)
        }
    }

    private func initConfigBlocks(_ nativeId: NativeId, _ config: Any?) {
        if let json = config as? [String: Any] {
            initPreprocessHttpRequest(nativeId, networkConfigJson: json)
            initPreprocessHttpResponse(nativeId, networkConfigJson: json)
        }
    }

    private func initPreprocessHttpRequest(_ nativeId: NativeId, networkConfigJson: [String: Any]) {
        guard let networkConfig = retrieve(nativeId) else {
            return
        }
        if networkConfigJson["preprocessHttpRequest"] != nil {
            preprocessHttpRequestDelegateBridges[nativeId] = PreprocessHttpRequestDelegateBridge(
                nativeId,
                bridge: bridge
            )
            networkConfig.preprocessHttpRequestDelegate = preprocessHttpRequestDelegateBridges[nativeId]
        }
    }

    private func initPreprocessHttpResponse(_ nativeId: NativeId, networkConfigJson: [String: Any]) {
        guard let networkConfig = retrieve(nativeId) else {
            return
        }
        if networkConfigJson["preprocessHttpResponse"] != nil {
            networkConfig.preprocessHttpResponse = { [weak self] type, response, completionHandler in
                self?.preprocessHttpResponseFromJS(nativeId, type, response, completionHandler)
            }
        }
    }

    internal func preprocessHttpRequestFromJS(
        nativeId: NativeId,
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
        bridge.enqueueJSCall("Network-\(nativeId)", method: "onPreprocessHttpRequest", args: args) {}
    }

    @objc(setPreprocessedHttpRequest:request:)
    func setPreprocessedHttpRequest(_ requestId: String, _ request: [String: Any]) {
        guard let completionHandler = preprocessHttpRequestCompletionHandlers[requestId],
              let httpRequest = RCTConvert.httpRequest(request) else {
            return
        }

        preprocessHttpRequestCompletionHandlers.removeValue(forKey: requestId)
        completionHandler(httpRequest)
    }

    private func preprocessHttpResponseFromJS(
        _ nativeId: NativeId,
        _ type: HttpRequestType,
        _ response: HttpResponse,
        _ completionHandler: @escaping (
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
        bridge.enqueueJSCall("Network-\(nativeId)", method: "onPreprocessHttpResponse", args: args) {}
    }

    @objc(setPreprocessedHttpResponse:response:)
    func setPreprocessedHttpResponse(_ responseId: String, _ response: [String: Any]) {
        guard let completionHandler = preprocessHttpResponseCompletionHandlers[responseId],
              let httpResponse = RCTConvert.httpResponse(response) else {
            return
        }
        preprocessHttpResponseCompletionHandlers.removeValue(forKey: responseId)
        completionHandler(httpResponse)
    }
}
