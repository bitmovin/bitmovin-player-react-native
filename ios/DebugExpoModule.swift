import ExpoModulesCore
import BitmovinPlayer

public class DebugExpoModule: Module {
    public func definition() -> ModuleDefinition {
        Name("DebugModule")
        
        AsyncFunction("setDebugLoggingEnabled") { (enabled: Bool) -> Void in
            DispatchQueue.main.async {
                DebugConfig.logging.logger?.level = enabled ? .verbose : .warning
            }
        }
    }
}