import BitmovinPlayer
import ExpoModulesCore

/// Shared handle used by source APIs while SourceModule still controls creation and release.
public final class SharedSource: SharedObject {
    let source: Source

    init(source: Source) {
        self.source = source
        super.init()
    }
}
