import BitmovinPlayer

@objc(BitmovinCastManagerModule)
class BitmovinCastManagerModule: NSObject, RCTBridgeModule {
    /// React bridge reference.
    @objc var bridge: RCTBridge!

    /// JS module name.
    static func moduleName() -> String! {
        "BitmovinCastManagerModule"
    }

    /// Module requires main thread initialization.
    static func requiresMainQueueSetup() -> Bool {
        true
    }

    /// Since most `BitmovinCastManagerModule` operations are UI related and need to be executed on the main thread, they are scheduled with `UIManager.addBlock`.
    var methodQueue: DispatchQueue! {
        bridge.uiManager.methodQueue
    }

    /**
     Initializes the BitmovinCastManager with the given options or with no options when none given.
     */
    @objc(initializeCastManager:resolver:rejecter:)
    func initializeCastManager(
        _ config: Any?,
        resolver resolve: @escaping RCTPromiseResolveBlock,
        rejecter reject: @escaping RCTPromiseRejectBlock
    ) {
        bridge.uiManager.addUIBlock { _, _ in
            if let config = config {
                guard let options = RCTConvert.castManagerOptions(config) else {
                    reject("BitmovinCastManagerModule", "Could not deserialize BitmovinCastManagerOptions", nil)
                    return
                }
                BitmovinCastManager.initializeCasting(options: options)
                resolve(nil)
            } else {
                BitmovinCastManager.initializeCasting()
                resolve(nil)
            }
        }
    }

    /**
     Returns true if casting is already initialized.
     - Parameter resolver: JS promise resolver.
     - Parameter rejecter: JS promise rejecter.
     */
    @objc(isInitialized:rejecter:)
    func isInitialized(
        resolver resolve: @escaping RCTPromiseResolveBlock,
        rejecter reject: @escaping RCTPromiseRejectBlock
    ) {
        bridge.uiManager.addUIBlock { _, _ in
            resolve(BitmovinCastManager.isInitialized())
        }
    }

    /**
     Sends the given message to the cast receiver on the provided namespace.
     If no namespace is provided, the one returned by defaultChannel.protocolNamespace is used.
     */
    @objc(sendMessage:messageNamespace:)
    func sendMessage(
        _ message: String,
        messageNamespace: String?
    ) {
        bridge.uiManager.addUIBlock { _, _ in
            BitmovinCastManager.sharedInstance().sendMessage(message, withNamespace: messageNamespace)
        }
    }
}
