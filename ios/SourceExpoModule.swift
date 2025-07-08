import BitmovinPlayer
import ExpoModulesCore

public class SourceExpoModule: Module {
    /// In-memory mapping from `nativeId`s to `Source` instances.
    /// This must match the Registry pattern from legacy SourceModule
    private var sources: Registry<Source> = [:]

    /// In-memory mapping from `nativeId`s to `SourceConfig` instances for casting.
    private var castSourceConfigs: Registry<SourceConfig> = [:]

    public func definition() -> ModuleDefinition {
        Name("SourceExpoModule")

        OnCreate {
            // Module initialization
        }

        OnDestroy {
            // Clean up sources
            sources.removeAll()
            castSourceConfigs.removeAll()
        }

        // PHASE 1: Start with simple utility methods

        /**
         Returns the count of active sources for debugging purposes
         */
        Function("getSourceCount") {
            sources.count
        }

        /**
         Checks if a source with the given nativeId exists
         */
        Function("hasSource") { (nativeId: String) in
            sources[nativeId] != nil
        }

        // TODO: Add SourceModule methods incrementally
        // Priority: initWithConfig, setSourceConfig methods
    }

    // CRITICAL: This method must remain available for cross-module access
    // Called by PlayerModule.loadSource()
    @objc
    public func retrieve(_ nativeId: NativeId) -> Source? {
        sources[nativeId]
    }

    // Fetches cast-specific `SourceConfig` by `NativeId` if exists
    public func retrieveCastSourceConfig(_ nativeId: NativeId) -> SourceConfig? {
        castSourceConfigs[nativeId]
    }
}
