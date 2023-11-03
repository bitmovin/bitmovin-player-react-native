import BitmovinPlayer

extension RNPlayerView: PlayerListener {
    public func onEvent(_ event: Event, player: Player) {
        onEvent?(event.toJSON())
    }

    public func onPlayerActive(_ event: PlayerActiveEvent, player: Player) {
        onPlayerActive?(event.toJSON())
    }

    public func onPlayerError(_ event: PlayerErrorEvent, player: Player) {
        onPlayerError?(event.toJSON())
    }

    public func onPlayerWarning(_ event: PlayerWarningEvent, player: Player) {
        onPlayerWarning?(event.toJSON())
    }

    public func onDestroy(_ event: DestroyEvent, player: Player) {
        onDestroy?(event.toJSON())
    }

    public func onMuted(_ event: MutedEvent, player: Player) {
        onMuted?(event.toJSON())
    }

    public func onUnmuted(_ event: UnmutedEvent, player: Player) {
        onUnmuted?(event.toJSON())
    }

    public func onReady(_ event: ReadyEvent, player: Player) {
        onReady?(event.toJSON())
    }

    public func onPaused(_ event: PausedEvent, player: Player) {
        onPaused?(event.toJSON())
    }

    public func onPlay(_ event: PlayEvent, player: Player) {
        onPlay?(event.toJSON())
    }

    public func onPlaying(_ event: PlayingEvent, player: Player) {
        onPlaying?(event.toJSON())
    }

    public func onPlaybackFinished(_ event: PlaybackFinishedEvent, player: Player) {
        onPlaybackFinished?(event.toJSON())
    }

    public func onSeek(_ event: SeekEvent, player: Player) {
        onSeek?(event.toJSON())
    }

    public func onSeeked(_ event: SeekedEvent, player: Player) {
        onSeeked?(event.toJSON())
    }

    public func onTimeShift(_ event: TimeShiftEvent, player: Player) {
        onTimeShift?(event.toJSON())
    }

    public func onTimeShifted(_ event: TimeShiftedEvent, player: Player) {
        onTimeShifted?(event.toJSON())
    }

    public func onStallStarted(_ event: StallStartedEvent, player: Player) {
        onStallStarted?(event.toJSON())
    }

    public func onStallEnded(_ event: StallEndedEvent, player: Player) {
        onStallEnded?(event.toJSON())
    }

    public func onTimeChanged(_ event: TimeChangedEvent, player: Player) {
        onTimeChanged?(event.toJSON())
    }

    public func onSourceLoad(_ event: SourceLoadEvent, player: Player) {
        onSourceLoad?(event.toJSON())
    }

    public func onSourceLoaded(_ event: SourceLoadedEvent, player: Player) {
        onSourceLoaded?(event.toJSON())
    }

    public func onSourceUnloaded(_ event: SourceUnloadedEvent, player: Player) {
        onSourceUnloaded?(event.toJSON())
    }

    public func onSourceError(_ event: SourceErrorEvent, player: Player) {
        onSourceError?(event.toJSON())
    }

    public func onSourceWarning(_ event: SourceWarningEvent, player: Player) {
        onSourceWarning?(event.toJSON())
    }

    public func onAudioAdded(_ event: AudioAddedEvent, player: Player) {
        onAudioAdded?(event.toJSON())
    }

    public func onAudioRemoved(_ event: AudioRemovedEvent, player: Player) {
        onAudioRemoved?(event.toJSON())
    }

    public func onAudioChanged(_ event: AudioChangedEvent, player: Player) {
        onAudioChanged?(event.toJSON())
    }

    public func onSubtitleAdded(_ event: SubtitleAddedEvent, player: Player) {
        onSubtitleAdded?(event.toJSON())
    }

    public func onSubtitleRemoved(_ event: SubtitleRemovedEvent, player: Player) {
        onSubtitleRemoved?(event.toJSON())
    }

    public func onSubtitleChanged(_ event: SubtitleChangedEvent, player: Player) {
        onSubtitleChanged?(event.toJSON())
    }

    public func onDownloadFinished(_ event: DownloadFinishedEvent, player: Player) {
        onDownloadFinished?(event.toJSON())
    }

    public func onAdBreakFinished(_ event: AdBreakFinishedEvent, player: Player) {
        onAdBreakFinished?(event.toJSON())
    }

    public func onAdBreakStarted(_ event: AdBreakStartedEvent, player: Player) {
        onAdBreakStarted?(event.toJSON())
    }

    public func onAdClicked(_ event: AdClickedEvent, player: Player) {
        onAdClicked?(event.toJSON())
    }

    public func onAdError(_ event: AdErrorEvent, player: Player) {
        onAdError?(event.toJSON())
    }

    public func onAdFinished(_ event: AdFinishedEvent, player: Player) {
        onAdFinished?(event.toJSON())
    }

    public func onAdManifestLoad(_ event: AdManifestLoadEvent, player: Player) {
        onAdManifestLoad?(event.toJSON())
    }

    public func onAdManifestLoaded(_ event: AdManifestLoadedEvent, player: Player) {
        onAdManifestLoaded?(event.toJSON())
    }

    public func onAdQuartile(_ event: AdQuartileEvent, player: Player) {
        onAdQuartile?(event.toJSON())
    }

    public func onAdScheduled(_ event: AdScheduledEvent, player: Player) {
        onAdScheduled?(event.toJSON())
    }

    public func onAdSkipped(_ event: AdSkippedEvent, player: Player) {
        onAdSkipped?(event.toJSON())
    }

    public func onAdStarted(_ event: AdStartedEvent, player: Player) {
        onAdStarted?(event.toJSON())
    }

    public func onVideoPlaybackQualityChanged(_ event: VideoDownloadQualityChangedEvent, player: Player) {
        onVideoPlaybackQualityChanged?(event.toJSON())
    }

#if os(iOS)
    public func onCastAvailable(_ event: CastAvailableEvent, player: Player) {
        onCastAvailable?(event.toJSON())
    }

    public func onCastPaused(_ event: CastPausedEvent, player: Player) {
        onCastPaused?(event.toJSON())
    }

    public func onCastPlaybackFinished(_ event: CastPlaybackFinishedEvent, player: Player) {
        onCastPlaybackFinished?(event.toJSON())
    }

    public func onCastPlaying(_ event: CastPlayingEvent, player: Player) {
        onCastPlaying?(event.toJSON())
    }

    public func onCastStarted(_ event: CastStartedEvent, player: Player) {
        onCastStarted?(event.toJSON())
    }

    public func onCastStart(_ event: CastStartEvent, player: Player) {
        onCastStart?(event.toJSON())
    }

    public func onCastStopped(_ event: CastStoppedEvent, player: Player) {
        onCastStopped?(event.toJSON())
    }

    public func onCastTimeUpdated(_ event: CastTimeUpdatedEvent, player: Player) {
        onCastTimeUpdated?(event.toJSON())
    }
    public func onCastWaitingForDevice(_ event: CastWaitingForDeviceEvent, player: Player) {
        onCastWaitingForDevice?(event.toJSON())
    }
#endif
}
