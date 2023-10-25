#if os(iOS)
import BitmovinPlayer
import Foundation

internal class OfflineContentManagerBridge: NSObject, OfflineContentManagerListener {
    enum EventType: String {
        case onCompleted
        case onError
        case onProgress
        case onOptionsAvailable
        case onDrmLicenseUpdated
        case onSuspended
        case onResumed
        case onCanceled
        case onDrmLicenseExpired
    }

    let offlineContentManager: OfflineContentManager
    let eventEmitter: RCTEventEmitter?
    let nativeId: NativeId
    let identifier: String
    var currentTrackSelection: OfflineTrackSelection?

    init(
        forManager offlineContentManager: OfflineContentManager,
        eventEmitter: RCTEventEmitter,
        nativeId: NativeId,
        identifier: String
    ) {
        self.offlineContentManager = offlineContentManager
        self.eventEmitter = eventEmitter
        self.nativeId = nativeId
        self.identifier = identifier
        super.init()

        offlineContentManager.add(listener: self)
    }

    func release() {
        offlineContentManager.remove(listener: self)
        currentTrackSelection = nil
    }

    func fetchAvailableTracks() {
        offlineContentManager.fetchAvailableTracks()

        sendOfflineEvent(eventType: .onOptionsAvailable)
    }

    /**
     Called when an error occurs.
     */
    func onOfflineError(
        _ event: OfflineErrorEvent,
        offlineContentManager: OfflineContentManager
    ) {
        sendOfflineEvent(eventType: .onError, body: [
            "code": event.code,
            "message": event.message
        ])
    }

    /**
     Called after a getOptions or when am OfflineOptionEntry has been updated during a process call.
     */
    func onAvailableTracksFetched(
        _ event: AvailableTracksFetchedEvent,
        offlineContentManager: OfflineContentManager
    ) {
        currentTrackSelection = event.tracks

        sendOfflineEvent(eventType: .onOptionsAvailable, body: [
            "options": RCTConvert.toJson(offlineTracks: event.tracks)
        ])
    }

    /**
     Called when a process call has completed.
     */
    func onContentDownloadFinished(
        _ event: ContentDownloadFinishedEvent,
        offlineContentManager: OfflineContentManager
    ) {
        sendOfflineEvent(eventType: .onCompleted, body: [
            "options": RCTConvert.toJson(offlineTracks: currentTrackSelection)
        ])
    }

    /**
     Called when the progress for a process call changes.
     */
    func onContentDownloadProgressChanged(
        _ event: ContentDownloadProgressChangedEvent,
        offlineContentManager: OfflineContentManager
    ) {
        sendOfflineEvent(eventType: .onProgress, body: [
            "progress": event.progress
        ])
    }

    /**
     Called when all actions have been suspended.
     */
    func onContentDownloadSuspended(
        _ event: ContentDownloadSuspendedEvent,
        offlineContentManager: OfflineContentManager
    ) {
        sendOfflineEvent(eventType: .onSuspended)
    }

    /**
     Called when all actions have been resumed.
     */
    func onContentDownloadResumed(
        _ event: ContentDownloadResumedEvent,
        offlineContentManager: OfflineContentManager
    ) {
        sendOfflineEvent(eventType: .onResumed)
    }

    /**
     Called when the download of the media content was canceled by the user
     and all partially downloaded content has been deleted from disk.
     */
    func onContentDownloadCanceled(
        _ event: ContentDownloadCanceledEvent,
        offlineContentManager: OfflineContentManager
    ) {
        sendOfflineEvent(eventType: .onCanceled)
    }

    /**
     Called when the DRM license was renewed.
     */
    func onOfflineContentLicenseRenewed(
        _ event: OfflineContentLicenseRenewedEvent,
        offlineContentManager: OfflineContentManager
    ) {
        sendOfflineEvent(eventType: .onDrmLicenseUpdated)
    }

    /**
     Called on every call to OfflineContentManager.createOfflineSourceConfig(restrictedToAssetCache:)
     if it is DRM protected and the offline DRM license has expired.
     */
    func onOfflineContentLicenseExpired(
        _ event: OfflineContentLicenseExpiredEvent,
        offlineContentManager: OfflineContentManager
    ) {
        sendOfflineEvent(eventType: .onDrmLicenseExpired)
    }

    private func sendOfflineEvent(eventType: EventType, body: [String: Any?] = [:]) {
        var baseEvent: [String: Any?] = [
            "nativeId": nativeId,
            "identifier": identifier,
            "eventType": eventType.rawValue,
            "state": RCTConvert.toJson(offlineState: offlineContentManager.offlineState)
        ]

        var eventBody = baseEvent.merging(body) { current, _ in current }

        do {
            try eventEmitter?.sendEvent(withName: "BitmovinOfflineEvent", body: eventBody)
        } catch let error as NSError {
            print(error)
        }
    }
}
#endif
