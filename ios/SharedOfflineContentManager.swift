import BitmovinPlayer
import ExpoModulesCore
import Foundation

public final class SharedOfflineContentManager: SharedObject {
    let events: SharedOfflineEvents
    private let callback: CallbackScope?
#if os(iOS)
    private struct Resource {
        let manager: OfflineContentManager
        let bridge: OfflineContentManagerBridge
    }
    private let identifier: String
    private let sourceConfig: SourceConfig
    private var resource: Resource?
    private var isDestroyed = false
    var offlineContentManager: OfflineContentManager { get throws { try getResource().manager } }
    var bridge: OfflineContentManagerBridge { get throws { try getResource().bridge } }
#endif

    init(config: [String: Any], callback: CallbackScope?, events: SharedOfflineEvents) throws {
        self.callback = callback
        self.events = events
#if os(iOS)
        guard let identifier = config["identifier"] as? String,
              let sourceConfig = RCTConvert.sourceConfig(config["sourceConfig"], callback: callback) else {
            callback?.close()
            throw Exception(name: "InvalidArgument", description: "Invalid offline identifier or source configuration")
        }
        self.identifier = identifier
        self.sourceConfig = sourceConfig
#endif
        super.init()
    }

    func destroy() {
        callback?.close()
#if os(iOS)
        guard !isDestroyed else { return }
        isDestroyed = true
        resource?.bridge.release()
#endif
    }

    deinit {
        callback?.close()
#if os(iOS)
        guard let resource else { return }
        DispatchQueue.main.async {
            resource.bridge.release()
            withExtendedLifetime(resource.manager) {}
        }
#endif
    }

    func download(_ request: [String: Any]?) throws {
#if os(iOS)
        let resource = try getResource()
        guard let request, let tracks = resource.bridge.currentTrackSelection else { return }
        if let audioOptionIds = request["audioOptionIds"] as? [String], !audioOptionIds.isEmpty {
            tracks.audioTracks.forEach { $0.action = audioOptionIds.contains($0.label) ? .download : .none }
        }
        if let textOptionIds = request["textOptionIds"] as? [String], !textOptionIds.isEmpty {
            tracks.textTracks.forEach { $0.action = textOptionIds.contains($0.label) ? .download : .none }
        }
        let config = DownloadConfig()
        config.minimumBitrate = request["minimumBitrate"] as? NSNumber
        resource.manager.download(tracks: tracks, downloadConfig: config)
#endif
    }

#if os(iOS)
    // The SDK factory throws, so use a throwing getter rather than a nonthrowing lazy property.
    private func getResource() throws -> Resource {
        if let resource { return resource }
        guard !isDestroyed else {
            throw Exception(name: "DestroyedObject", description: "Destroyed before SDK creation")
        }
        let manager = try OfflineManager.sharedInstance().offlineContentManager(for: sourceConfig, id: identifier)
        let resource = Resource(manager: manager, bridge: OfflineContentManagerBridge(
            forManager: manager, events: events, identifier: identifier
        ))
        self.resource = resource
        return resource
    }
#endif
}
