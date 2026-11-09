import BitmovinPlayer
import ExpoModulesCore
import ExpoModulesJSI

public class DrmModule: Module {
    public func definition() -> ModuleDefinition {
        Name("DrmModule")
        Function("create") { (config: [String: Any], callback: JavaScriptValue) in
            try SharedDrmConfig(config: config, callback: CallbackScope(callback: callback, context: appContext))
        }
        Class("DrmConfig", SharedDrmConfig.self) {
            AsyncFunction("destroy") { (owner: SharedDrmConfig) in owner.destroy() }
        }
    }
}
