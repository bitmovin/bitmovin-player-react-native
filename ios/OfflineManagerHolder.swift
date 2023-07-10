import Foundation
import BitmovinPlayer

class OfflineManagerHolder: NSObject, OfflineContentManagerListener {

    var contentManager: OfflineContentManager
    var eventEmitter: RCTEventEmitter?
    var nativeId: NativeId
    var identifier: String
    var trackSelection: OfflineTrackSelection? = nil

    init(forManager contentManager: OfflineContentManager, eventEmitter: RCTEventEmitter, nativeId: NativeId, identifier: String) {
        self.contentManager = contentManager
        self.eventEmitter = eventEmitter
        self.nativeId = nativeId
        self.identifier = identifier
        super.init()

        contentManager.add(listener: self)
    }

    func release() {
        contentManager.remove(listener: self)
        eventEmitter = nil
        trackSelection = nil
    }

    /**
     Called when an error occurs.
     */
    func onOfflineError(_ event: OfflineErrorEvent, offlineContentManager: OfflineContentManager) {
        sendOfflineEvent(eventType: "onError", contentManager: offlineContentManager, body: [
            "code": event.code,
            "message": event.message
        ])
    }

    /**
     Called after a getOptions or when am OfflineOptionEntry has been updated during a process call.
     */
    func onAvailableTracksFetched(_ event: AvailableTracksFetchedEvent, offlineContentManager: OfflineContentManager) {
        trackSelection = event.tracks

        sendOfflineEvent(eventType: "onOptionsAvailable", contentManager: offlineContentManager, body: [
            "options": RCTConvert.toJson(offlineTracks: event.tracks),
            "state": RCTConvert.toJson(offlineState: offlineContentManager.offlineState)
        ])
    }

    /**
     Called when a process call has completed.
     */
    func onContentDownloadFinished(_ event: ContentDownloadFinishedEvent, offlineContentManager: OfflineContentManager) {
        sendOfflineEvent(eventType: "onCompleted", contentManager: offlineContentManager, body: [
            "options": RCTConvert.toJson(offlineTracks: trackSelection),
            "state": RCTConvert.toJson(offlineState: offlineContentManager.offlineState)
        ])
    }

    /**
     Called when the progress for a process call changes.
     */
    func onContentDownloadProgressChanged(_ event: ContentDownloadProgressChangedEvent, offlineContentManager: OfflineContentManager) {
        sendOfflineEvent(eventType: "onProgress", contentManager: offlineContentManager, body: [
            "progress": event.progress
        ])
    }


    /**
     Called when all actions have been suspended.
     */
    func onContentDownloadSuspended(_ event: ContentDownloadSuspendedEvent, offlineContentManager: OfflineContentManager) {
        sendOfflineEvent(eventType: "onSuspended", contentManager: offlineContentManager)
    }

    /**
     Called when all actions have been resumed.
     */
    func onContentDownloadResumed(_ event: ContentDownloadResumedEvent, offlineContentManager: OfflineContentManager) {
        sendOfflineEvent(eventType: "onResumed", contentManager: offlineContentManager)
    }

    /**
     Called when the DRM license was renewed.
     */
    func onOfflineContentLicenseRenewed(_ event: OfflineContentLicenseRenewedEvent, offlineContentManager: OfflineContentManager) {
        sendOfflineEvent(eventType: "onDrmLicenseUpdated", contentManager: offlineContentManager)
    }

    private func sendOfflineEvent(eventType: String, contentManager: OfflineContentManager) {
        sendOfflineEvent(eventType: eventType, contentManager: contentManager, body: nil)
    }

    private func sendOfflineEvent(eventType: String, contentManager: OfflineContentManager, body: [String: Any?]?) {
        var baseEvent: [String: Any?] = [
            "nativeId": nativeId,
            "identifier": identifier,
            "eventType": eventType,
        ]

        var extraParams = body ?? [:]
        var eventBody = baseEvent.merging(extraParams) { (current, _) in current }

        do {
            try eventEmitter?.sendEvent(withName: "BitmovinOfflineEvent", body: eventBody)
        } catch let error as NSError {
            print(error)
        }

    }
}
