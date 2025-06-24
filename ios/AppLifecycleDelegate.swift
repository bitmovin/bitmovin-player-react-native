import BitmovinPlayerCore
import ExpoModulesCore

public class AppLifecycleDelegate: ExpoAppDelegateSubscriber {
    public func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey : Any]? = nil) -> Bool {
        // TODO: Add support for OfflineConfig via config plugin
#if os(iOS)
        OfflineManager.initializeOfflineManager()
#endif
        return true
    }

    public func application(_ application: UIApplication, handleEventsForBackgroundURLSession identifier: String, completionHandler: @escaping () -> Void) {
#if os(iOS)
        OfflineManager.sharedInstance().add(completionHandler: completionHandler, for: identifier)
#endif
    }
}
