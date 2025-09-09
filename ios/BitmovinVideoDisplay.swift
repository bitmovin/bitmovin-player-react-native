import BitmovinPlayer
import Combine
import GoogleInteractiveMediaAds

internal class BitmovinVideoDisplay: NSObject, IMAVideoDisplay {
    weak var delegate: IMAVideoDisplayDelegate?
    private weak var player: Player?
    private var cancellables = Set<AnyCancellable>()

    init(player: Player) {
        self.player = player
        super.init()
        setupEventListeners()
    }

    // swiftlint:disable:next function_body_length
    private func setupEventListeners() {
        guard let player else { return }

        player.events.on(ReadyEvent.self)
            .sink { [weak self] _ in
                guard let self else { return }
                self.delegate?.videoDisplayDidLoad(self)
                self.delegate?.videoDisplayDidStart(self)
                self.delegate?.videoDisplayIsPlaybackReady?(self)
            }
            .store(in: &cancellables)

        player.events.on(TimeChangedEvent.self)
            .sink { [weak self] _ in
                guard let self else { return }

                self.delegate?.videoDisplay(
                    self,
                    didProgressWithMediaTime: player.currentTime(.absoluteTime),
                    totalTime: player.isLive ? 0 : player.duration
                )
            }
            .store(in: &cancellables)

        player.events.on(PlaybackFinishedEvent.self)
            .sink { [weak self] _ in
                guard let self else { return }
                self.delegate?.videoDisplayDidComplete(self)
            }
            .store(in: &cancellables)

        player.events.on(PausedEvent.self)
            .sink { [weak self] _ in
                guard let self else { return }
                self.delegate?.videoDisplayDidPause(self)
            }
            .store(in: &cancellables)

        player.events.on(PlayEvent.self)
            .sink { [weak self] _ in
                guard let self else { return }
                self.delegate?.videoDisplayDidResume(self)
            }
            .store(in: &cancellables)

        player.events.on(StallStartedEvent.self)
            .sink { [weak self] _ in
                guard let self else { return }
                self.delegate?.videoDisplayDidStartBuffering?(self)
            }
            .store(in: &cancellables)

        player.events.on(StallEndedEvent.self)
            .sink { [weak self] _ in
                guard let self else { return }
                self.delegate?.videoDisplayIsPlaybackReady?(self)
            }
            .store(in: &cancellables)

        Publishers.Merge(
            player.events.on(SourceErrorEvent.self)
                .map {
                    NSError(
                        domain: "BitmovinPlayerSourceError",
                        code: $0.code.rawValue,
                        userInfo: [NSLocalizedDescriptionKey: $0.message]
                    )
                },
            player.events.on(PlayerErrorEvent.self)
                .map {
                    NSError(
                        domain: "BitmovinPlayerPlayerError",
                        code: $0.code.rawValue,
                        userInfo: [NSLocalizedDescriptionKey: $0.message]
                    )
                }
        )
        .sink { [weak self] error in
            guard let self else { return }
            self.delegate?.videoDisplay(self, didReceiveError: error)
        }
        .store(in: &cancellables)

        player.events.on(MetadataEvent.self)
            .sink { [weak self] event in
                guard let self else { return }
                guard event.metadataType == .ID3 else {
                    return
                }

                let metadata: [String: String] = event.metadata
                    .entries
                    .compactMap { $0 as? AVMetadataItem }
                    .reduce(into: [:]) { partialResult, entry in
                        guard let key = entry.key,
                              let value = entry.value else {
                            return
                        }
                        partialResult["\(key)"] = "\(value)"
                    }

                self.delegate?.videoDisplay(self, didReceiveTimedMetadata: metadata)
            }
            .store(in: &cancellables)
    }

    var volume: Float {
        get {
            Float(player?.volume ?? 0) / 100.0
        }
        set {
            player?.volume = Int(newValue * 100)
            delegate?.videoDisplay(self, volumeChangedTo: NSNumber(value: newValue))
        }
    }

    func loadStream(_ streamURL: URL, withSubtitles subtitles: [[String: String]]) {
        // TODO: add support for progressive streams
        // TODO: add support for subtitles
        player?.load(sourceConfig: SourceConfig(url: streamURL, type: .hls))
    }

    func play() {
        player?.play()
    }

    func pause() {
        player?.pause()
    }

    func reset() {
        player?.unload()
    }

    func seekStream(toTime time: TimeInterval) {
        guard let player else { return }

        if player.isLive {
            let offset = player.maxTimeShift
            player.timeShift = time - offset
        } else {
            player.seek(time: time)
        }
    }

    // MARK: - IMAAdPlaybackInfo
    var currentMediaTime: TimeInterval {
        player?.currentTime ?? 0
    }

    var totalMediaTime: TimeInterval {
        guard let player else { return 0 }
        return player.isLive ? 0 : player.duration
    }

    var bufferedMediaTime: TimeInterval {
        player?.buffer.getLevel(.forwardDuration).level ?? 0
    }

    var isPlaying: Bool {
        player?.isPlaying ?? false
    }
}
