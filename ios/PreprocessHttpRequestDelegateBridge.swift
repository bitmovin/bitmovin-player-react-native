import BitmovinPlayer

/**
 * Bridge class for handling HTTP request preprocessing with the NetworkModule.
 * This maintains the same delegation pattern as the legacy implementation but works with Expo modules.
 */
internal class PreprocessHttpRequestDelegateBridge: NSObject, PreprocessHttpRequestDelegate {
    private let nativeId: String
    private weak var networkExpoModule: NetworkModule?

    init(_ nativeId: String, networkExpoModule: NetworkModule) {
        self.nativeId = nativeId
        self.networkExpoModule = networkExpoModule
        super.init()
    }

    func preprocessHttpRequest(
        _ type: String,
        httpRequest: HttpRequest,
        completionHandler: @escaping (
            _ request: HttpRequest
        ) -> Void
    ) {
        networkExpoModule?.preprocessHttpRequestFromJS(
            nativeId: nativeId,
            type: type,
            request: httpRequest,
            completionHandler: completionHandler
        )
    }
}
