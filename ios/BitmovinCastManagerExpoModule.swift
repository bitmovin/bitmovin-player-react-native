import ExpoModulesCore
import BitmovinPlayer

public class BitmovinCastManagerExpoModule: Module {
    public func definition() -> ModuleDefinition {
        Name("BitmovinCastManagerModule")

        AsyncFunction("initializeCastManager") { (config: [String: Any]?) throws in
            #if os(iOS)
            if let config = config {
                guard let options = RCTConvert.castManagerOptions(config) else {
                    throw Exception(name: "DESERIALIZATION_ERROR", description: "Could not deserialize BitmovinCastManagerOptions")
                }
                BitmovinCastManager.initializeCasting(options: options)
            } else {
                BitmovinCastManager.initializeCasting()
            }
            #endif
        }.runOnQueue(.main)

        AsyncFunction("isInitialized") { () -> Bool in
            #if os(iOS)
            return BitmovinCastManager.isInitialized()
            #else
            return false
            #endif
        }.runOnQueue(.main)

        AsyncFunction("sendMessage") { (message: String, messageNamespace: String?) in
            #if os(iOS)
            BitmovinCastManager.sharedInstance().sendMessage(message, withNamespace: messageNamespace)
            #endif
        }.runOnQueue(.main)
    }
}