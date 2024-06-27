import BitmovinPlayer

internal class PreprocessHttpRequestDelegateBridge: NSObject, PreprocessHttpRequestDelegate {
    private let nativeId: NativeId
    private let bridge: RCTBridge

    init(_ nativeId: NativeId, bridge: RCTBridge) {
        self.nativeId = nativeId
        self.bridge = bridge
        super.init()
    }

    func preprocessHttpRequest(
        _ type: String,
        httpRequest: HttpRequest,
        completionHandler: @escaping (
            _ request: HttpRequest
        ) -> Void
    ) {
        guard let networkModule = bridge[NetworkModule.self] else {
            return
        }
        networkModule.preprocessHttpRequestFromJS(
            nativeId: nativeId,
            type: type,
            request: httpRequest,
            completionHandler: completionHandler
        )
    }
}
