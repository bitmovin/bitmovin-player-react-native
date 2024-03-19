import BitmovinPlayer

extension RNPlayerView: PlayerListener {
    public func onEvent(_ event: Event, player: Player) {
        guard let jsonConvertibleEvent = event as? JsonConvertible else { return }
        onBmpEvent?(jsonConvertibleEvent.toJSON())
    }

    public func onPlayerActive(_ event: PlayerActiveEvent, player: Player) {
        onBmpPlayerActive?(event.toJSON())
    }

    public func onPlayerError(_ event: PlayerErrorEvent, player: Player) {
        onBmpPlayerError?(event.toJSON())
    }

    public func onPlayerWarning(_ event: PlayerWarningEvent, player: Player) {
        onBmpPlayerWarning?(event.toJSON())
    }

    public func onDestroy(_ event: DestroyEvent, player: Player) {
        onBmpDestroy?(event.toJSON())
    }

    public func onMuted(_ event: MutedEvent, player: Player) {
        onBmpMuted?(event.toJSON())
    }

    public func onUnmuted(_ event: UnmutedEvent, player: Player) {
        onBmpUnmuted?(event.toJSON())
    }

    public func onReady(_ event: ReadyEvent, player: Player) {
        onBmpReady?(event.toJSON())
    }

    public func onPaused(_ event: PausedEvent, player: Player) {
        onBmpPaused?(event.toJSON())
    }

    public func onPlay(_ event: PlayEvent, player: Player) {
        onBmpPlay?(event.toJSON())
    }

    public func onPlaying(_ event: PlayingEvent, player: Player) {
        onBmpPlaying?(event.toJSON())
    }

    public func onPlaybackFinished(_ event: PlaybackFinishedEvent, player: Player) {
        onBmpPlaybackFinished?(event.toJSON())
    }

    public func onSeek(_ event: SeekEvent, player: Player) {
        onBmpSeek?(event.toJSON())
    }

    public func onSeeked(_ event: SeekedEvent, player: Player) {
        onBmpSeeked?(event.toJSON())
    }

    public func onTimeShift(_ event: TimeShiftEvent, player: Player) {
        onBmpTimeShift?(event.toJSON())
    }

    public func onTimeShifted(_ event: TimeShiftedEvent, player: Player) {
        onBmpTimeShifted?(event.toJSON())
    }

    public func onStallStarted(_ event: StallStartedEvent, player: Player) {
        onBmpStallStarted?(event.toJSON())
    }

    public func onStallEnded(_ event: StallEndedEvent, player: Player) {
        onBmpStallEnded?(event.toJSON())
    }

    public func onTimeChanged(_ event: TimeChangedEvent, player: Player) {
        onBmpTimeChanged?(event.toJSON())
    }

    public func onPlaybackSpeedChanged(_ event: PlaybackSpeedChangedEvent, player: Player) {
        onBmpPlaybackSpeedChanged?(event.toJSON())
    }

    public func onSourceLoad(_ event: SourceLoadEvent, player: Player) {
        onBmpSourceLoad?(event.toJSON())
    }

    public func onSourceLoaded(_ event: SourceLoadedEvent, player: Player) {
        onBmpSourceLoaded?(event.toJSON())
    }

    public func onSourceUnloaded(_ event: SourceUnloadedEvent, player: Player) {
        onBmpSourceUnloaded?(event.toJSON())
    }

    public func onSourceError(_ event: SourceErrorEvent, player: Player) {
        onBmpSourceError?(event.toJSON())
    }

    public func onSourceWarning(_ event: SourceWarningEvent, player: Player) {
        onBmpSourceWarning?(event.toJSON())
    }

    public func onAudioAdded(_ event: AudioAddedEvent, player: Player) {
        onBmpAudioAdded?(event.toJSON())
    }

    public func onAudioRemoved(_ event: AudioRemovedEvent, player: Player) {
        onBmpAudioRemoved?(event.toJSON())
    }

    public func onAudioChanged(_ event: AudioChangedEvent, player: Player) {
        onBmpAudioChanged?(event.toJSON())
    }

    public func onSubtitleAdded(_ event: SubtitleAddedEvent, player: Player) {
        onBmpSubtitleAdded?(event.toJSON())
    }

    public func onSubtitleRemoved(_ event: SubtitleRemovedEvent, player: Player) {
        onBmpSubtitleRemoved?(event.toJSON())
    }

    public func onSubtitleChanged(_ event: SubtitleChangedEvent, player: Player) {
        onBmpSubtitleChanged?(event.toJSON())
    }

    public func onDownloadFinished(_ event: DownloadFinishedEvent, player: Player) {
        onBmpDownloadFinished?(event.toJSON())
    }

    public func onAdBreakFinished(_ event: AdBreakFinishedEvent, player: Player) {
        onBmpAdBreakFinished?(event.toJSON())
    }

    public func onAdBreakStarted(_ event: AdBreakStartedEvent, player: Player) {
        onBmpAdBreakStarted?(event.toJSON())
    }

    public func onAdClicked(_ event: AdClickedEvent, player: Player) {
        onBmpAdClicked?(event.toJSON())
    }

    public func onAdError(_ event: AdErrorEvent, player: Player) {
        onBmpAdError?(event.toJSON())
    }

    public func onAdFinished(_ event: AdFinishedEvent, player: Player) {
        onBmpAdFinished?(event.toJSON())
    }

    public func onAdManifestLoad(_ event: AdManifestLoadEvent, player: Player) {
        onBmpAdManifestLoad?(event.toJSON())
    }

    public func onAdManifestLoaded(_ event: AdManifestLoadedEvent, player: Player) {
        onBmpAdManifestLoaded?(event.toJSON())
    }

    public func onAdQuartile(_ event: AdQuartileEvent, player: Player) {
        onBmpAdQuartile?(event.toJSON())
    }

    public func onAdScheduled(_ event: AdScheduledEvent, player: Player) {
        onBmpAdScheduled?(event.toJSON())
    }

    public func onAdSkipped(_ event: AdSkippedEvent, player: Player) {
        onBmpAdSkipped?(event.toJSON())
    }

    public func onAdStarted(_ event: AdStartedEvent, player: Player) {
        onBmpAdStarted?(event.toJSON())
    }

    public func onVideoDownloadQualityChanged(_ event: VideoDownloadQualityChangedEvent, player: Player) {
        onBmpVideoDownloadQualityChanged?(event.toJSON())
     }

    public func onVideoPlaybackQualityChanged(_ event: VideoPlaybackQualityChangedEvent, player: Player) {
        onBmpVideoPlaybackQualityChanged?(event.toJSON())
    }

    public func onCueEnter(_ event: CueEnterEvent, player: Player) {
        onBmpCueEnter?(event.toJSON())
    }

    public func onCueExit(_ event: CueExitEvent, player: Player) {
        onBmpCueExit?(event.toJSON())
    }

#if os(iOS)
    public func onCastAvailable(_ event: CastAvailableEvent, player: Player) {
        onBmpCastAvailable?(event.toJSON())
    }

    public func onCastPaused(_ event: CastPausedEvent, player: Player) {
        onBmpCastPaused?(event.toJSON())
    }

    public func onCastPlaybackFinished(_ event: CastPlaybackFinishedEvent, player: Player) {
        onBmpCastPlaybackFinished?(event.toJSON())
    }

    public func onCastPlaying(_ event: CastPlayingEvent, player: Player) {
        onBmpCastPlaying?(event.toJSON())
    }

    public func onCastStarted(_ event: CastStartedEvent, player: Player) {
        onBmpCastStarted?(event.toJSON())
    }

    public func onCastStart(_ event: CastStartEvent, player: Player) {
        onBmpCastStart?(event.toJSON())
    }

    public func onCastStopped(_ event: CastStoppedEvent, player: Player) {
        onBmpCastStopped?(event.toJSON())
    }

    public func onCastTimeUpdated(_ event: CastTimeUpdatedEvent, player: Player) {
        onBmpCastTimeUpdated?(event.toJSON())
    }
    public func onCastWaitingForDevice(_ event: CastWaitingForDeviceEvent, player: Player) {
        onBmpCastWaitingForDevice?(event.toJSON())
    }
#endif
}
