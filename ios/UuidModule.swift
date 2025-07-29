import ExpoModulesCore
import Foundation

/**
 Native module for easy and fast unique ID generation on JS side. Used to generate native instance IDs.
 */
public class UuidModule: Module {
    public func definition() -> ModuleDefinition {
        Name("UuidModule")

        Function("generate") { () -> String in
            UUID().uuidString
        }
    }
}
