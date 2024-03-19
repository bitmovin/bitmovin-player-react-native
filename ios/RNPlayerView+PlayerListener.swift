import BitmovinPlayer

extension RNPlayerView: PlayerListener {
    public func onEvent(_ event: Event, player: Player) {
        guard let jsonConvertibleEvent = event as? JsonConvertible else { return }
        bmpOnEvent?(jsonConvertibleEvent.toJSON())
    }

    public func onPlayerActive(_ event: PlayerActiveEvent, player: Player) {
        bmpOnPlayerActive?(event.toJSON())
    }

    public func onPlayerError(_ event: PlayerErrorEvent, player: Player) {
        bmpOnPlayerError?(event.toJSON())
    }

    public func onPlayerWarning(_ event: PlayerWarningEvent, player: Player) {
        bmpOnPlayerWarning?(event.toJSON())
    }

    public func onDestroy(_ event: DestroyEvent, player: Player) {
        bmpOnDestroy?(event.toJSON())
    }

    public func onMuted(_ event: MutedEvent, player: Player) {
        bmpOnMuted?(event.toJSON())
    }

    public func onUnmuted(_ event: UnmutedEvent, player: Player) {
        bmpOnUnmuted?(event.toJSON())
    }

    public func onReady(_ event: ReadyEvent, player: Player) {
        bmpOnReady?(event.toJSON())
    }

    public func onPaused(_ event: PausedEvent, player: Player) {
        bmpOnPaused?(event.toJSON())
    }

    public func onPlay(_ event: PlayEvent, player: Player) {
        bmpOnPlay?(event.toJSON())
    }

    public func onPlaying(_ event: PlayingEvent, player: Player) {
        bmpOnPlaying?(event.toJSON())
    }

    public func onPlaybackFinished(_ event: PlaybackFinishedEvent, player: Player) {
        bmpOnPlaybackFinished?(event.toJSON())
    }

    public func onSeek(_ event: SeekEvent, player: Player) {
        bmpOnSeek?(event.toJSON())
    }

    public func onSeeked(_ event: SeekedEvent, player: Player) {
        bmpOnSeeked?(event.toJSON())
    }

    public func onTimeShift(_ event: TimeShiftEvent, player: Player) {
        bmpOnTimeShift?(event.toJSON())
    }

    public func onTimeShifted(_ event: TimeShiftedEvent, player: Player) {
        bmpOnTimeShifted?(event.toJSON())
    }

    public func onStallStarted(_ event: StallStartedEvent, player: Player) {
        bmpOnStallStarted?(event.toJSON())
    }

    public func onStallEnded(_ event: StallEndedEvent, player: Player) {
        bmpOnStallEnded?(event.toJSON())
    }

    public func onTimeChanged(_ event: TimeChangedEvent, player: Player) {
        bmpOnTimeChanged?(event.toJSON())
    }

    public func onPlaybackSpeedChanged(_ event: PlaybackSpeedChangedEvent, player: Player) {
        bmpOnPlaybackSpeedChanged?(event.toJSON())
    }

    public func onSourceLoad(_ event: SourceLoadEvent, player: Player) {
        bmpOnSourceLoad?(event.toJSON())
    }

    public func onSourceLoaded(_ event: SourceLoadedEvent, player: Player) {
        bmpOnSourceLoaded?(event.toJSON())
    }

    public func onSourceUnloaded(_ event: SourceUnloadedEvent, player: Player) {
        bmpOnSourceUnloaded?(event.toJSON())
    }

    public func onSourceError(_ event: SourceErrorEvent, player: Player) {
        bmpOnSourceError?(event.toJSON())
    }

    public func onSourceWarning(_ event: SourceWarningEvent, player: Player) {
        bmpOnSourceWarning?(event.toJSON())
    }

    public func onAudioAdded(_ event: AudioAddedEvent, player: Player) {
        bmpOnAudioAdded?(event.toJSON())
    }

    public func onAudioRemoved(_ event: AudioRemovedEvent, player: Player) {
        bmpOnAudioRemoved?(event.toJSON())
    }

    public func onAudioChanged(_ event: AudioChangedEvent, player: Player) {
        bmpOnAudioChanged?(event.toJSON())
    }

    public func onSubtitleAdded(_ event: SubtitleAddedEvent, player: Player) {
        bmpOnSubtitleAdded?(event.toJSON())
    }

    public func onSubtitleRemoved(_ event: SubtitleRemovedEvent, player: Player) {
        bmpOnSubtitleRemoved?(event.toJSON())
    }

    public func onSubtitleChanged(_ event: SubtitleChangedEvent, player: Player) {
        bmpOnSubtitleChanged?(event.toJSON())
    }

    public func onDownloadFinished(_ event: DownloadFinishedEvent, player: Player) {
        bmpOnDownloadFinished?(event.toJSON())
    }

    public func onAdBreakFinished(_ event: AdBreakFinishedEvent, player: Player) {
        bmpOnAdBreakFinished?(event.toJSON())
    }

    public func onAdBreakStarted(_ event: AdBreakStartedEvent, player: Player) {
        bmpOnAdBreakStarted?(event.toJSON())
    }

    public func onAdClicked(_ event: AdClickedEvent, player: Player) {
        bmpOnAdClicked?(event.toJSON())
    }

    public func onAdError(_ event: AdErrorEvent, player: Player) {
        bmpOnAdError?(event.toJSON())
    }

    public func onAdFinished(_ event: AdFinishedEvent, player: Player) {
        bmpOnAdFinished?(event.toJSON())
    }

    public func onAdManifestLoad(_ event: AdManifestLoadEvent, player: Player) {
        bmpOnAdManifestLoad?(event.toJSON())
    }

    public func onAdManifestLoaded(_ event: AdManifestLoadedEvent, player: Player) {
        bmpOnAdManifestLoaded?(event.toJSON())
    }

    public func onAdQuartile(_ event: AdQuartileEvent, player: Player) {
        bmpOnAdQuartile?(event.toJSON())
    }

    public func onAdScheduled(_ event: AdScheduledEvent, player: Player) {
        bmpOnAdScheduled?(event.toJSON())
    }

    public func onAdSkipped(_ event: AdSkippedEvent, player: Player) {
        bmpOnAdSkipped?(event.toJSON())
    }

    public func onAdStarted(_ event: AdStartedEvent, player: Player) {
        bmpOnAdStarted?(event.toJSON())
    }

    public func onVideoDownloadQualityChanged(_ event: VideoDownloadQualityChangedEvent, player: Player) {
        bmpOnVideoDownloadQualityChanged?(event.toJSON())
     }

    public func onVideoPlaybackQualityChanged(_ event: VideoPlaybackQualityChangedEvent, player: Player) {
        bmpOnVideoPlaybackQualityChanged?(event.toJSON())
    }

    public func onCueEnter(_ event: CueEnterEvent, player: Player) {
        bmpOnCueEnter?(event.toJSON())
    }

    public func onCueExit(_ event: CueExitEvent, player: Player) {
        bmpOnCueExit?(event.toJSON())
    }

#if os(iOS)
    public func onCastAvailable(_ event: CastAvailableEvent, player: Player) {
        bmpOnCastAvailable?(event.toJSON())
    }

    public func onCastPaused(_ event: CastPausedEvent, player: Player) {
        bmpOnCastPaused?(event.toJSON())
    }

    public func onCastPlaybackFinished(_ event: CastPlaybackFinishedEvent, player: Player) {
        bmpOnCastPlaybackFinished?(event.toJSON())
    }

    public func onCastPlaying(_ event: CastPlayingEvent, player: Player) {
        bmpOnCastPlaying?(event.toJSON())
    }

    public func onCastStarted(_ event: CastStartedEvent, player: Player) {
        bmpOnCastStarted?(event.toJSON())
    }

    public func onCastStart(_ event: CastStartEvent, player: Player) {
        bmpOnCastStart?(event.toJSON())
    }

    public func onCastStopped(_ event: CastStoppedEvent, player: Player) {
        bmpOnCastStopped?(event.toJSON())
    }

    public func onCastTimeUpdated(_ event: CastTimeUpdatedEvent, player: Player) {
        bmpOnCastTimeUpdated?(event.toJSON())
    }
    public func onCastWaitingForDevice(_ event: CastWaitingForDeviceEvent, player: Player) {
        bmpOnCastWaitingForDevice?(event.toJSON())
    }
#endif
}
