import BitmovinPlayer
import ExpoModulesCore

public class DebugExpoModule: Module {
    public func definition() -> ModuleDefinition {
        Name("DebugModule")

        AsyncFunction("setDebugLoggingEnabled") { (enabled: Bool) in
            DebugConfig.logging.logger?.level = enabled ? .verbose : .warning
        }.runOnQueue(.main)
    }
}
