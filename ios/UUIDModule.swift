/**
 Native module for easy and fast unique ID generation on JS side. Used to generate native instance IDs.
 */
@objc(UUIDModule)
class UUIDModule: NSObject, RCTBridgeModule {
    /// Initialize this module on main thread.
    static func requiresMainQueueSetup() -> Bool {
        true
    }
    
    /// Exported JS module name.
    static func moduleName() -> String! {
        "UUIDModule"
    }
    
    /**
     Synchronously generate a random UUIDv4.
     - Returns: Random UUID RFC 4122 version 4.
     */
    @objc func generate() -> String {
        UUID().uuidString
    }
}
