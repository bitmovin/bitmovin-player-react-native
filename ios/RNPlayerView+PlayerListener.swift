import BitmovinPlayer

extension RNPlayerView: PlayerListener {
    func onEvent(_ event: Event, player: Player) {
        onEvent?(event.toJSON())
    }

    func onPlayerActive(_ event: PlayerActiveEvent, player: Player) {
        onPlayerActive?(event.toJSON())
    }

    func onPlayerError(_ event: PlayerErrorEvent, player: Player) {
        onPlayerError?(event.toJSON())
    }

    func onPlayerWarning(_ event: PlayerWarningEvent, player: Player) {
        onPlayerWarning?(event.toJSON())
    }

    func onDestroy(_ event: DestroyEvent, player: Player) {
        onDestroy?(event.toJSON())
    }

    func onMuted(_ event: MutedEvent, player: Player) {
        onMuted?(event.toJSON())
    }

    func onUnmuted(_ event: UnmutedEvent, player: Player) {
        onUnmuted?(event.toJSON())
    }

    func onReady(_ event: ReadyEvent, player: Player) {
        onReady?(event.toJSON())
    }

    func onPaused(_ event: PausedEvent, player: Player) {
        onPaused?(event.toJSON())
    }

    func onPlay(_ event: PlayEvent, player: Player) {
        onPlay?(event.toJSON())
    }

    func onPlaying(_ event: PlayingEvent, player: Player) {
        onPlaying?(event.toJSON())
    }

    func onPlaybackFinished(_ event: PlaybackFinishedEvent, player: Player) {
        onPlaybackFinished?(event.toJSON())
    }

    func onSeek(_ event: SeekEvent, player: Player) {
        onSeek?(event.toJSON())
    }

    func onSeeked(_ event: SeekedEvent, player: Player) {
        onSeeked?(event.toJSON())
    }

    func onStallStarted(_ event: StallStartedEvent, player: Player) {
        onStallStarted?(event.toJSON())
    }

    func onStallEnded(_ event: StallEndedEvent, player: Player) {
        onStallEnded?(event.toJSON())
    }

    func onTimeChanged(_ event: TimeChangedEvent, player: Player) {
        onTimeChanged?(event.toJSON())
    }

    func onSourceLoad(_ event: SourceLoadEvent, player: Player) {
        onSourceLoad?(event.toJSON())
    }

    func onSourceLoaded(_ event: SourceLoadedEvent, player: Player) {
        onSourceLoaded?(event.toJSON())
    }

    func onSourceUnloaded(_ event: SourceUnloadedEvent, player: Player) {
        onSourceUnloaded?(event.toJSON())
    }

    func onSourceError(_ event: SourceErrorEvent, player: Player) {
        onSourceError?(event.toJSON())
    }

    func onSourceWarning(_ event: SourceWarningEvent, player: Player) {
        onSourceWarning?(event.toJSON())
    }
    
    func onAudioAdded(_ event: AudioAddedEvent, player: Player) {
        onAudioAdded?(event.toJSON())
    }

    func onAudioRemoved(_ event: AudioRemovedEvent, player: Player) {
        onAudioRemoved?(event.toJSON())
    }

    func onAudioChanged(_ event: AudioChangedEvent, player: Player) {
        onAudioChanged?(event.toJSON())
    }

    func onSubtitleAdded(_ event: SubtitleAddedEvent, player: Player) {
        onSubtitleAdded?(event.toJSON())
    }

    func onSubtitleRemoved(_ event: SubtitleRemovedEvent, player: Player) {
        onSubtitleRemoved?(event.toJSON())
    }

    func onSubtitleChanged(_ event: SubtitleChangedEvent, player: Player) {
        onSubtitleChanged?(event.toJSON())
    }

    func onAdBreakFinished(_ event: AdBreakFinishedEvent, player: Player) {
        onAdBreakFinished?(event.toJSON())
    }

    func onAdBreakStarted(_ event: AdBreakStartedEvent, player: Player) {
        onAdBreakStarted?(event.toJSON())
    }

    func onAdClicked(_ event: AdClickedEvent, player: Player) {
        onAdClicked?(event.toJSON())
    }

    func onAdError(_ event: AdErrorEvent, player: Player) {
        onAdError?(event.toJSON())
    }

    func onAdFinished(_ event: AdFinishedEvent, player: Player) {
        onAdFinished?(event.toJSON())
    }

    func onAdManifestLoad(_ event: AdManifestLoadEvent, player: Player) {
        onAdManifestLoad?(event.toJSON())
    }

    func onAdManifestLoaded(_ event: AdManifestLoadedEvent, player: Player) {
        onAdManifestLoaded?(event.toJSON())
    }

    func onAdQuartile(_ event: AdQuartileEvent, player: Player) {
        onAdQuartile?(event.toJSON())
    }

    func onAdScheduled(_ event: AdScheduledEvent, player: Player) {
        onAdScheduled?(event.toJSON())
    }

    func onAdSkipped(_ event: AdSkippedEvent, player: Player) {
        onAdSkipped?(event.toJSON())
    }

    func onAdStarted(_ event: AdStartedEvent, player: Player) {
        onAdStarted?(event.toJSON())
    }

    func onVideoPlaybackQualityChanged(_ event: VideoDownloadQualityChangedEvent, player: Player) {
        onVideoPlaybackQualityChanged?(event.toJSON())
    }
}
