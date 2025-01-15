import BitmovinPlayerCore
import ExpoModulesCore

public class AppLifecycleDelegate: ExpoAppDelegateSubscriber {
    public func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey : Any]? = nil) -> Bool {
        // TODO: Add support for OfflineConfig via config plugin
        OfflineManager.initializeOfflineManager()
        return true
    }

    public func application(_ application: UIApplication, handleEventsForBackgroundURLSession identifier: String, completionHandler: @escaping () -> Void) {
        OfflineManager.sharedInstance().add(completionHandler: completionHandler, for: identifier)
    }
}
