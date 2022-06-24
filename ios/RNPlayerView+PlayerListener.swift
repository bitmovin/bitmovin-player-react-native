import BitmovinPlayer

extension RNPlayerView: PlayerListener {
    public func onEvent(_ event: Event, player: Player) {
        onEvent?(event.toJSON())
    }

    func onPlayerActive(_ event: PlayerActiveEvent, player: Player) {
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
}
