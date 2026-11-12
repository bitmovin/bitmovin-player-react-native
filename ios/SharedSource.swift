import BitmovinPlayer
import ExpoModulesCore
import ExpoModulesJSI

public final class SharedSource: SharedObject {
    private let factory: () -> Source
    var fairplayRequests: SourceFairplayRequests { SourceFairplayRequests.attached(to: source) }
    private(set) var configSnapshot: [String: Any]?
    private let events = SharedObjectEvents()
    private weak var initializedSource: Source?
    private(set) lazy var source: Source = {
        let source = factory()
        source.add(listener: events)
        configSnapshot = Self.snapshot(source.sourceConfig)
        initializedSource = source
        return source
    }()

    convenience init(source: Source) {
        self.init { source }
        // SDK-created offline sources must already emit events when the JS query resolves.
        _ = self.source
    }

    @JavaScriptActor
    convenience init(config: JavaScriptValue?, analytics: [String: Any]?, context: AppContext) throws {
        guard let sourceConfig = RCTConvert.sourceConfig(config, context: context) else {
            throw Exception(name: "InvalidArgument", description: "Invalid source configuration")
        }
        let metadata = RCTConvert.analyticsSourceMetadata(analytics)
        self.init {
            if let metadata {
                return SourceFactory.createSource(from: sourceConfig, sourceMetadata: metadata)
            }
            return SourceFactory.createSource(from: sourceConfig)
        }
    }

    deinit {
        guard let source = initializedSource else { return }
        let events = events
        DispatchQueue.main.async { source.remove(listener: events) }
    }

    private init(factory: @escaping () -> Source) {
        self.factory = factory
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
