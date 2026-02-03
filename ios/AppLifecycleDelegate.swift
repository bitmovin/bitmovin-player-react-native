import BitmovinPlayerCore
import ExpoModulesCore

public class AppLifecycleDelegate: ExpoAppDelegateSubscriber {
    public func application(
        _ application: UIApplication,
        didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil
    ) -> Bool {
        // TODO: Add support for OfflineConfig via config plugin
#if os(iOS)
        guard let infoDictionary = Bundle.main.infoDictionary else {
            return true
        }
        if let offlineSupportEnabled = infoDictionary["BitmovinPlayerOfflineSupportEnabled"] as? Bool,
           offlineSupportEnabled {
            OfflineManager.initializeOfflineManager()
        }

        if !BitmovinCastManager.isInitialized() {
            let options = BitmovinCastManagerOptions()
            if let applicationId = infoDictionary["BitmovinPlayerGoogleCastApplicationId"] as? String {
                options.applicationId = applicationId
            }
            if let messageNamespace = infoDictionary["BitmovinPlayerGoogleCastMessageNamespace"] as? String {
                options.messageNamespace = messageNamespace
            }
            BitmovinCastManager.initializeCasting(options: options)
        }
#endif
        return true
    }

    public func application(
        _ application: UIApplication,
        handleEventsForBackgroundURLSession identifier: String,
        completionHandler: @escaping () -> Void
    ) {
#if os(iOS)
        OfflineManager.sharedInstance().add(completionHandler: completionHandler, for: identifier)
#endif
    }
}
