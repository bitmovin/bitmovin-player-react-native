import ExpoModulesCore
import BitmovinPlayer

public class BitmovinCastManagerExpoModule: Module {
    public func definition() -> ModuleDefinition {
        Name("BitmovinCastManagerModule")
        
        AsyncFunction("initializeCastManager") { (config: [String: Any]?) -> Void in
#if os(iOS)
            DispatchQueue.main.async {
                if let config = config {
                    guard let options = RCTConvert.castManagerOptions(config) else {
                        throw Exception(name: "DESERIALIZATION_ERROR", description: "Could not deserialize BitmovinCastManagerOptions")
                    }
                    BitmovinCastManager.initializeCasting(options: options)
                } else {
                    BitmovinCastManager.initializeCasting()
                }
            }
#endif
        }
        
        AsyncFunction("isInitialized") { () -> Bool in
#if os(iOS)
            return BitmovinCastManager.isInitialized()
#else
            return false
#endif
        }
        
        AsyncFunction("sendMessage") { (message: String, messageNamespace: String?) -> Void in
#if os(iOS)
            DispatchQueue.main.async {
                BitmovinCastManager.sharedInstance().sendMessage(message, withNamespace: messageNamespace)
            }
#endif
        }
    }
}