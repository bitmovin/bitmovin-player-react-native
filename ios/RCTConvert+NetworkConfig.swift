import BitmovinPlayer
import BitmovinPlayerCore
import ExpoModulesCore

extension RCTConvert {
    static func networkConfig(_ json: Any?) -> NetworkConfig? {
        guard let json = json as? [String: Any] else { return nil }
        let config = NetworkConfig()
        if let callback = json["preprocessHttpRequest"] as? JavaScriptCallback {
            config.preprocessHttpRequest = { type, request, completion in
                callback.request(
                    arguments: [Self.toJson(httpRequestType: type), Self.toJson(httpRequest: request)]
                ) { value in
                    completion((value as? [String: Any]).flatMap(Self.httpRequest) ?? request)
                }
            }
        }
        if let callback = json["preprocessHttpResponse"] as? JavaScriptCallback {
            config.preprocessHttpResponse = { type, response, completion in
                callback.request(
                    arguments: [Self.toJson(httpRequestType: type), Self.toJson(httpResponse: response)]
                ) { value in
                    completion((value as? [String: Any]).flatMap(Self.httpResponse) ?? response)
                }
            }
        }
        return config
    }
}
