import BitmovinPlayer
import ExpoModulesCore
import Foundation

public final class SharedOffline: SharedObject {
    private let events: SharedOfflineEvents
#if os(iOS)
    let offlineContentManager: OfflineContentManager
    private(set) var bridge: OfflineContentManagerBridge?
    private let drm: SharedDrmConfig?

    init(manager: OfflineContentManager, identifier: String, drm: SharedDrmConfig?, events: SharedOfflineEvents) {
        offlineContentManager = manager
        self.drm = drm
        self.events = events
        super.init()
        bridge = OfflineContentManagerBridge(forManager: manager, events: events, identifier: identifier)
    }
#else
    init(events: SharedOfflineEvents) {
        self.events = events
        super.init()
    }
#endif

    func destroy() {
#if os(iOS)
        bridge?.release()
        bridge = nil
#endif
    }

    deinit {
#if os(iOS)
        let manager = offlineContentManager
        let bridge = bridge
        DispatchQueue.main.async {
            bridge?.release()
            withExtendedLifetime(manager) {}
        }
#endif
    }

    func download(_ request: [String: Any]?) {
#if os(iOS)
        guard let bridge, let request, offlineContentManager.offlineState == .notDownloaded,
              let tracks = bridge.currentTrackSelection else { return }
        if let audioOptionIds = request["audioOptionIds"] as? [String], !audioOptionIds.isEmpty {
            tracks.audioTracks.forEach { $0.action = audioOptionIds.contains($0.label) ? .download : .none }
        }
        if let textOptionIds = request["textOptionIds"] as? [String], !textOptionIds.isEmpty {
            tracks.textTracks.forEach { $0.action = textOptionIds.contains($0.label) ? .download : .none }
        }
        let config = DownloadConfig()
        config.minimumBitrate = request["minimumBitrate"] as? NSNumber
        offlineContentManager.download(tracks: tracks, downloadConfig: config)
#endif
    }
}
