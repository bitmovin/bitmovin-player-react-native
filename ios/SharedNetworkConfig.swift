import BitmovinPlayer
import BitmovinPlayerCore
import ExpoModulesCore

public final class SharedNetworkConfig: SharedObject {
    let config = NetworkConfig()
    private let callback: CallbackScope

    init(config json: [String: Any], callback: CallbackScope) {
        self.callback = callback
        super.init()
        if json["preprocessHttpRequest"] != nil {
            config.preprocessHttpRequest = { [weak self] type, request, completion in
                guard let self else { completion(request); return }
                self.callback.request(
                    "preprocessHttpRequest",
                    arguments: [RCTConvert.toJson(httpRequestType: type), RCTConvert.toJson(httpRequest: request)],
                    fallbackArgument: 1
                ) { value in
                    completion((value as? [String: Any]).flatMap(RCTConvert.httpRequest) ?? request)
                }
            }
        }
        if json["preprocessHttpResponse"] != nil {
            config.preprocessHttpResponse = { [weak self] type, response, completion in
                guard let self else { completion(response); return }
                self.callback.request(
                    "preprocessHttpResponse",
                    arguments: [RCTConvert.toJson(httpRequestType: type), RCTConvert.toJson(httpResponse: response)],
                    fallbackArgument: 1
                ) { value in
                    completion((value as? [String: Any]).flatMap(RCTConvert.httpResponse) ?? response)
                }
            }
        }
    }

    func destroy() { callback.close() }
    deinit { callback.close() }
    override public func sharedObjectWillRelease() { callback.close() }
}
