import BitmovinPlayer

@objc(NetworkModule)
public class NetworkModule: NSObject, RCTBridgeModule {
    // swiftlint:disable:next implicitly_unwrapped_optional
    @objc public var bridge: RCTBridge!

    /// In-memory mapping from `nativeId`s to `NetworkConfig` instances.
    private var networkConfigs: Registry<NetworkConfig> = [:]
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

        preprocessHttpResponseCompletionHandlers.keys.filter { $0.starts(with: nativeId) }.forEach {
            preprocessHttpResponseCompletionHandlers.removeValue(forKey: $0)
        }
    }

    private func initConfigBlocks(_ nativeId: NativeId, _ config: Any?) {
        guard let json = config as? [String: Any] else { return }
        initPreprocessHttpResponse(nativeId, networkConfigJson: json)
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
