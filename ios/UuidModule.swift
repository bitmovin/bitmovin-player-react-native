/**
 Native module for easy and fast unique ID generation on JS side. Used to generate native instance IDs.
 */
@objc(UuidModule)
public class UuidModule: NSObject, RCTBridgeModule {
    /// Initialize this module on main thread.
    public static func requiresMainQueueSetup() -> Bool {
        true
    }

    // swiftlint:disable:next implicitly_unwrapped_optional
    public static func moduleName() -> String! {
        "UuidModule"
    }

    /**
     Synchronously generate a random UUIDv4.
     - Returns: Random UUID RFC 4122 version 4.
     */
    @objc
    public func generate() -> String {
        UUID().uuidString
    }
}
