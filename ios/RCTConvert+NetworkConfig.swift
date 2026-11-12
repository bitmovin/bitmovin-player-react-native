import BitmovinPlayer
import BitmovinPlayerCore
import ExpoModulesCore
import ExpoModulesJSI

extension RCTConvert {
    @JavaScriptActor
    static func networkConfig(
        _ raw: JavaScriptValue?, context: AppContext, track: @escaping (CancellableCallback) -> Void
    ) -> NetworkConfig? {
        guard let raw, raw.isObject() else { return nil }
        let config = NetworkConfig()
        if let callback = weakCallback(raw, "preprocessHttpRequest") {
            config.preprocessHttpRequest = { [weak context] type, request, completion in
                guard let context else { completion(request); return }
                track(callback.callAsync(
                    context,
                    arguments: [Self.toJson(httpRequestType: type), Self.toJson(httpRequest: request)],
                    convert: { (value: [String: Any]) in Self.httpRequest(value) },
                    completion: { completion($0 ?? request) }
                ))
            }
        }
        if let callback = weakCallback(raw, "preprocessHttpResponse") {
            config.preprocessHttpResponse = { [weak context] type, response, completion in
                guard let context else { completion(response); return }
                track(callback.callAsync(
                    context,
                    arguments: [Self.toJson(httpRequestType: type), Self.toJson(httpResponse: response)],
                    convert: { (value: [String: Any]) in Self.httpResponse(value) },
                    completion: { completion($0 ?? response) }
                ))
            }
        }
        return config
    }
}
