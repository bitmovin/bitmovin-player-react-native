extension RCTBridge {
    /// Helper to allow acquiring typed module instance from the bridge.
    subscript<T: RCTBridgeModule>(_ moduleType: T.Type) -> T? {
        module(for: moduleType) as? T
    }
}
