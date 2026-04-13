#if canImport(GoogleInteractiveMediaAds) && os(iOS)
import AVFoundation
import BitmovinPlayer
import GoogleInteractiveMediaAds
import UIKit

/// Bridges Bitmovin Player to the Google IMA SDK's IMAVideoDisplay protocol for DAI (Dynamic Ad Insertion).
/// Forwards player events to the IMA delegate so the SDK can control and monitor playback.
internal final class BitmovinVideoDisplay: NSObject, IMAVideoDisplay {
    weak var delegate: IMAVideoDisplayDelegate?
    private weak var player: Player?
    private let eventForwarder: IMAEventForwarder
    /// Tracks whether we've sent videoDisplayDidStart for the current stream.
    /// IMA expects didStart only on first play, didResume on resume after pause.
    private var hasReportedStart = false

    init(player: Player) {
        self.player = player
        self.eventForwarder = IMAEventForwarder()
        super.init()
        eventForwarder.videoDisplay = self
        player.add(listener: eventForwarder)
    }

    deinit {
        player?.remove(listener: eventForwarder)
    }

    // MARK: - IMAVideoDisplay

    func loadStream(_ streamURL: URL, withSubtitles subtitles: [[String: String]]) {
        hasReportedStart = false
        // IMA DAI returns HLS; fallback to .hls type for compatibility
        let sourceConfig = SourceConfig(url: streamURL, type: .hls)
        player?.load(sourceConfig: sourceConfig)
    }

    func play() {
        player?.play()
    }

    func pause() {
        player?.pause()
    }

    func reset() {
        hasReportedStart = false
        player?.unload()
    }

    func seekStream(toTime time: TimeInterval) {
        guard let player else { return }
        if player.isLive {
            // Bitmovin: timeShift is 0 at live edge, negative going backward. IMA passes absolute stream time.
            // Live edge absolute time = current absolute time - current timeShift.
            let liveEdgeAbsoluteTime = player.currentTime(.absoluteTime) - player.timeShift
            player.timeShift = time - liveEdgeAbsoluteTime
        } else {
            player.seek(time: time)
        }
    }

    // MARK: - Volume

    var volume: Float {
        get {
            guard let player else { return 1.0 }
            return Float(player.volume) / 100.0
        }
        set {
            player?.volume = Int(newValue * 100)
            delegate?.videoDisplay(self, volumeChangedTo: NSNumber(value: newValue))
        }
    }

    // MARK: - IMAAdPlaybackInfo

    /// Use absolute time so IMA gets the same timeline as didProgressWithMediaTime (live streams use UTC).
    var currentMediaTime: TimeInterval {
        player?.currentTime(.absoluteTime) ?? 0
    }

    var totalMediaTime: TimeInterval {
        guard let player else { return 0 }
        return player.isLive ? 0 : player.duration
    }

    /// IMA expects bufferedMediaTime on the same absolute timeline as currentMediaTime.
    /// forwardDuration is relative (e.g. 5.0 sec); convert to absolute: currentAbsolute + forwardBuffer.
    var bufferedMediaTime: TimeInterval {
        guard let player else { return 0 }
        let currentAbsolute = player.currentTime(.absoluteTime)
        let forwardBuffer = player.buffer.getLevel(.forwardDuration).level ?? 0
        return currentAbsolute + forwardBuffer
    }

    var isPlaying: Bool {
        player?.isPlaying ?? false
    }

    // MARK: - Internal callbacks from event forwarder

    fileprivate func onReady() {
        // Only report loaded/ready here. Per IMA semantics, videoDisplayDidStart = "starts playing for the first time";
        // we report that in onPlay() when playback actually starts.
        delegate?.videoDisplayDidLoad(self)
        delegate?.videoDisplayIsPlaybackReady?(self)
    }

    fileprivate func onTimeChanged() {
        guard let player else { return }
        delegate?.videoDisplay(
            self,
            didProgressWithMediaTime: player.currentTime(.absoluteTime),
            totalTime: player.isLive ? 0 : player.duration
        )
    }

    fileprivate func onPlaybackFinished() {
        delegate?.videoDisplayDidComplete(self)
    }

    fileprivate func onPaused() {
        delegate?.videoDisplayDidPause(self)
    }

    fileprivate func onPlay() {
        if !hasReportedStart {
            hasReportedStart = true
            delegate?.videoDisplayDidStart(self)
        } else {
            delegate?.videoDisplayDidResume(self)
        }
    }

    fileprivate func onStallStarted() {
        delegate?.videoDisplayDidStartBuffering?(self)
    }

    fileprivate func onStallEnded() {
        delegate?.videoDisplayIsPlaybackReady?(self)
    }

    fileprivate func onError(_ error: NSError) {
        delegate?.videoDisplay(self, didReceiveError: error)
    }

    fileprivate func onMetadata(_ metadata: [String: String]) {
        delegate?.videoDisplay(self, didReceiveTimedMetadata: metadata)
    }
}

// MARK: - PlayerListener that forwards events to IMA delegate

private final class IMAEventForwarder: NSObject, PlayerListener {
    weak var videoDisplay: BitmovinVideoDisplay?

    func onReady(_ event: ReadyEvent, player: Player) {
        videoDisplay?.onReady()
    }

    func onTimeChanged(_ event: TimeChangedEvent, player: Player) {
        videoDisplay?.onTimeChanged()
    }

    func onPlaybackFinished(_ event: PlaybackFinishedEvent, player: Player) {
        videoDisplay?.onPlaybackFinished()
    }

    func onPaused(_ event: PausedEvent, player: Player) {
        videoDisplay?.onPaused()
    }

    func onPlay(_ event: PlayEvent, player: Player) {
        videoDisplay?.onPlay()
    }

    func onStallStarted(_ event: StallStartedEvent, player: Player) {
        videoDisplay?.onStallStarted()
    }

    func onStallEnded(_ event: StallEndedEvent, player: Player) {
        videoDisplay?.onStallEnded()
    }

    func onSourceError(_ event: SourceErrorEvent, player: Player) {
        let error = NSError(
            domain: "BitmovinPlayerSourceError",
            code: event.code.rawValue,
            userInfo: [NSLocalizedDescriptionKey: event.message]
        )
        videoDisplay?.onError(error)
    }

    func onPlayerError(_ event: PlayerErrorEvent, player: Player) {
        let error = NSError(
            domain: "BitmovinPlayerPlayerError",
            code: event.code.rawValue,
            userInfo: [NSLocalizedDescriptionKey: event.message]
        )
        videoDisplay?.onError(error)
    }

    func onMetadata(_ event: MetadataEvent, player: Player) {
        guard event.metadataType == .ID3 else {
            return
        }
        let metadata: [String: String] = metadataDict(from: event)
        if !metadata.isEmpty {
            videoDisplay?.onMetadata(metadata)
        }
    }
}

// MARK: - MetadataEvent → [String: String] for IMA DAI (ID3 TXXX cue points)

private func metadataDict(from event: MetadataEvent) -> [String: String] {
    event.metadata.entries
        .compactMap { $0 as? AVMetadataItem }
        .reduce(into: [:]) { partialResult, entry in
            guard let key = entry.key,
                  let value = entry.value else {
                return
            }
            partialResult["\(key)"] = "\(value)"
        }
}
#endif
