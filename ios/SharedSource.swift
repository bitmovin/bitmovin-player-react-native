import BitmovinPlayer
import ExpoModulesCore

public final class SharedSource: SharedObject {
    private let initialization: SharedObjectInitialization<Source>
    var source: Source { get throws { try initialize() } }
    var fairplayRequests: SourceFairplayRequests {
        get throws { SourceFairplayRequests.attached(to: try source) }
    }
    private(set) var configSnapshot: [String: Any]?
    private let events = SharedObjectEvents()
    private let callback: CallbackScope?
    private var isObserving = false

    init(source: Source, callback: CallbackScope?) {
        initialization = SharedObjectInitialization { source }
        self.callback = callback
        configSnapshot = Self.snapshot(source.sourceConfig)
        super.init()
        events.owner = self
    }

    init(config: [String: Any]?, analytics: [String: Any]?, callback: CallbackScope?) {
        self.callback = callback
        initialization = SharedObjectInitialization {
            guard let sourceConfig = RCTConvert.sourceConfig(config, callback: callback) else {
                throw Exception(name: "InvalidArgument", description: "Invalid source configuration")
            }
            if let metadata = RCTConvert.analyticsSourceMetadata(analytics) {
                return SourceFactory.createSource(from: sourceConfig, sourceMetadata: metadata)
            }
            return SourceFactory.createSource(from: sourceConfig)
        }
        super.init()
        events.owner = self
    }

    @discardableResult
    func initialize() throws -> Source {
        do {
            let source = try initialization.get()
            if !isObserving {
                source.add(listener: events)
                isObserving = true
                configSnapshot = Self.snapshot(source.sourceConfig)
            }
            return source
        } catch { callback?.close(); throw error }
    }

    private static func snapshot(_ config: SourceConfig) -> [String: Any]? {
        let type: String
        switch config.type {
        case .hls: type = "hls"
        case .dash: type = "dash"
        case .progressive: type = "progressive"
        default: return nil
        }
        guard let url = config.url else { return nil }
        return ["url": url.absoluteString, "type": type, "title": config.title,
                "description": config.sourceDescription, "metadata": config.metadata]
    }

    deinit {
        callback?.close()
        guard let source = initialization.initializedValue else { return }
        let events = events
        DispatchQueue.main.async { source.remove(listener: events) }
    }
    override public func sharedObjectWillRelease() { callback?.close() }
}
