import BitmovinPlayer
import ExpoModulesCore

public final class SharedSource: SharedObject {
    let source: Source
    let fairplayRequests: SourceFairplayRequests
    private let events = SharedObjectEvents()
    private let callback: CallbackScope?

    init(source: Source, callback: CallbackScope?) {
        self.source = source
        self.callback = callback
        fairplayRequests = SourceFairplayRequests.attached(to: source)
        super.init()
        events.owner = self
        source.add(listener: events)
    }
    deinit {
        callback?.close()
        let source = source
        let events = events
        DispatchQueue.main.async {
            source.remove(listener: events)
        }
    }
    override public func sharedObjectWillRelease() { callback?.close() }
}
