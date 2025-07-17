import BitmovinPlayer
import ExpoModulesCore

public class BitmovinCastManagerModule: Module {
    public func definition() -> ModuleDefinition {
        Name("BitmovinCastManagerModule")

        AsyncFunction("initializeCastManager") { (options: [String: Any]?) throws in
            #if os(iOS)
            if let options {
                guard let options = RCTConvert.castManagerOptions(options) else {
                    throw Exception(
                        name: "DESERIALIZATION_ERROR",
                        description: "Could not deserialize BitmovinCastManagerOptions"
                    )
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

        AsyncFunction("updateContext") { () in
            // iOS/tvOS doesn't need updateContext like Android does
            // This is a no-op for iOS compatibility
        }.runOnQueue(.main)
    }
}
