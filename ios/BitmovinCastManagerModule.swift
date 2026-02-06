import BitmovinPlayer
import ExpoModulesCore

public class BitmovinCastManagerModule: Module {
    public func definition() -> ModuleDefinition {
        Name("BitmovinCastManagerModule")

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
