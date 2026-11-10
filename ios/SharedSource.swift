import BitmovinPlayer
import ExpoModulesCore

public final class SharedSource: SharedObject {
    let source: Source
    let legacyInstanceId: Int
    let fairplayRequests: SourceFairplayRequests
    private let callback: CallbackScope?

    init(source: Source, legacyInstanceId: Int, callback: CallbackScope?) {
        self.source = source
        self.legacyInstanceId = legacyInstanceId
        self.callback = callback
        fairplayRequests = SourceFairplayRequests.attached(to: source)
        super.init()
    }

    deinit { callback?.close() }
    override public func sharedObjectWillRelease() { callback?.close() }
}
