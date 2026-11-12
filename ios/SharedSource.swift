import BitmovinPlayer
import ExpoModulesCore

public final class SharedSource: SharedObject {
    private let factory: () -> Source
    var fairplayRequests: SourceFairplayRequests { SourceFairplayRequests.attached(to: source) }
    private(set) var configSnapshot: [String: Any]?
    private let events = SharedObjectEvents()
    private let callback: CallbackScope?
    private weak var initializedSource: Source?
    private(set) lazy var source: Source = {
        let source = factory()
        source.add(listener: events)
        configSnapshot = Self.snapshot(source.sourceConfig)
        initializedSource = source
        return source
    }()

    convenience init(source: Source, callback: CallbackScope?) {
        self.init(factory: { source }, callback: callback)
        // SDK-created offline sources must already emit events when the JS query resolves.
        _ = self.source
    }

    convenience init(config: [String: Any]?, analytics: [String: Any]?, callback: CallbackScope?) throws {
        guard let sourceConfig = RCTConvert.sourceConfig(config, callback: callback) else {
            callback?.close()
            throw Exception(name: "InvalidArgument", description: "Invalid source configuration")
        }
        let metadata = RCTConvert.analyticsSourceMetadata(analytics)
        self.init(factory: {
            if let metadata {
                return SourceFactory.createSource(from: sourceConfig, sourceMetadata: metadata)
            }
            return SourceFactory.createSource(from: sourceConfig)
        }, callback: callback)
    }

    deinit {
        callback?.close()
        guard let source = initializedSource else { return }
        let events = events
        DispatchQueue.main.async { source.remove(listener: events) }
    }
    override public func sharedObjectWillRelease() { callback?.close() }

    private init(factory: @escaping () -> Source, callback: CallbackScope?) {
        self.factory = factory
        self.callback = callback
        super.init()
        events.owner = self
    }

    private static func snapshot(_ config: SourceConfig) -> [String: Any]? {
        let type: String
        switch config.type {
        case .hls:
            type = "hls"
        case .dash:
            type = "dash"
        case .progressive:
            type = "progressive"
        default:
            return nil
        }
        let url = config.url
        return [
            "url": url.absoluteString,
            "type": type,
            "title": config.title,
            "description": config.sourceDescription,
            "metadata": config.metadata
        ]
    }
}
