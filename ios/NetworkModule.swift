import BitmovinPlayer
import BitmovinPlayerCore
import ExpoModulesCore
import ExpoModulesJSI

public class NetworkModule: Module {
    public func definition() -> ModuleDefinition {
        Name("NetworkModule")
        Function("create") { (config: [String: Any], callback: JavaScriptValue) in
            try SharedNetworkConfig(config: config, callback: CallbackScope(callback: callback, context: appContext))
        }
        Class("NetworkConfig", SharedNetworkConfig.self) {
            AsyncFunction("destroy") { (owner: SharedNetworkConfig) in owner.destroy() }
        }
    }
}
