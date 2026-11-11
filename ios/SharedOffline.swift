import BitmovinPlayer
import ExpoModulesCore
import Foundation

public final class SharedOffline: SharedObject {
    let events: SharedOfflineEvents
    private let callback: CallbackScope?
#if os(iOS)
    private struct Resource {
        let manager: OfflineContentManager
        let bridge: OfflineContentManagerBridge
    }
    private let initialization: SharedObjectInitialization<Resource>
    var offlineContentManager: OfflineContentManager { get throws { try initialization.get().manager } }
    var bridge: OfflineContentManagerBridge { get throws { try initialization.get().bridge } }

    init(config: [String: Any], callback: CallbackScope?, events: SharedOfflineEvents) {
        self.callback = callback
        self.events = events
        initialization = SharedObjectInitialization {
            do {
                guard let identifier = config["identifier"] as? String,
                      let sourceConfig = RCTConvert.sourceConfig(config["sourceConfig"], callback: callback) else {
                    throw Exception(
                        name: "InvalidArgument", description: "Invalid offline identifier or source configuration"
                    )
                }
                let manager = try OfflineManager.sharedInstance().offlineContentManager(
                    for: sourceConfig, id: identifier
                )
                return Resource(manager: manager, bridge: OfflineContentManagerBridge(
                    forManager: manager, events: events, identifier: identifier
                ))
            } catch {
                callback?.close()
                throw error
            }
        }
        super.init()
    }
#else
    init(config: [String: Any], callback: CallbackScope?, events: SharedOfflineEvents) {
        self.callback = callback
        self.events = events
        super.init()
    }
#endif

    func destroy() {
        callback?.close()
#if os(iOS)
        initialization.initializedValue?.bridge.release()
        initialization.cancel()
#endif
    }

    deinit {
        callback?.close()
#if os(iOS)
        guard let resource = initialization.initializedValue else { return }
        DispatchQueue.main.async {
            resource.bridge.release()
            withExtendedLifetime(resource.manager) {}
        }
#endif
    }

    func download(_ request: [String: Any]?) throws {
#if os(iOS)
        let resource = try initialization.get()
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
}
