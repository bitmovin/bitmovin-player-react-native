import BitmovinPlayer
import BitmovinPlayerCore
import ExpoModulesCore

extension RCTConvert {
    static func networkConfig(_ json: Any?, callback: CallbackScope?) -> NetworkConfig? {
        guard let json = json as? [String: Any] else { return nil }
        let config = NetworkConfig()
        if json["preprocessHttpRequest"] != nil {
            config.preprocessHttpRequest = { type, request, completion in
                guard let callback else { completion(request); return }
                callback.request(
                    "networkConfig.preprocessHttpRequest",
                    arguments: [Self.toJson(httpRequestType: type), Self.toJson(httpRequest: request)],
                    fallbackArgument: 1
                ) { value in
                    completion((value as? [String: Any]).flatMap(Self.httpRequest) ?? request)
                }
            }
        }
        if json["preprocessHttpResponse"] != nil {
            config.preprocessHttpResponse = { type, response, completion in
                guard let callback else { completion(response); return }
                callback.request(
                    "networkConfig.preprocessHttpResponse",
                    arguments: [Self.toJson(httpRequestType: type), Self.toJson(httpResponse: response)],
                    fallbackArgument: 1
                ) { value in
                    completion((value as? [String: Any]).flatMap(Self.httpResponse) ?? response)
                }
            }
        }
        return config
    }
}
