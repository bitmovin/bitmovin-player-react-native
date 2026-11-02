import BitmovinPlayer
@_spi(ExperimentalApi)
import BitmovinPlayerCore
import Combine

/**
 * Native event types bridged to React Native, keyed by their React Native event name
 * (the event's `name` without the `on` prefix, e.g. `onPlayerActive` -> `playerActive`).
 */
internal enum PlayerEventTypes {
    /// All events a native `Player` emits, including the source events of its active source.
    static let player: [String: EventSubscriber<Player>] = {
        var subscribers: [String: EventSubscriber<Player>] = [
            "playerActive": playerEvent(PlayerActiveEvent.self),
            "playerInactive": playerEvent(PlayerInactiveEvent.self),
            "playerError": playerEvent(PlayerErrorEvent.self),
            "playerWarning": playerEvent(PlayerWarningEvent.self),
            "destroy": playerEvent(DestroyEvent.self),
            "muted": playerEvent(MutedEvent.self),
            "unmuted": playerEvent(UnmutedEvent.self),
            "ready": playerEvent(ReadyEvent.self),
            "paused": playerEvent(PausedEvent.self),
            "play": playerEvent(PlayEvent.self),
            "playing": playerEvent(PlayingEvent.self),
            "playbackFinished": playerEvent(PlaybackFinishedEvent.self),
            "seek": playerEvent(SeekEvent.self),
            "seeked": playerEvent(SeekedEvent.self),
            "timeShift": playerEvent(TimeShiftEvent.self),
            "timeShifted": playerEvent(TimeShiftedEvent.self),
            "stallStarted": playerEvent(StallStartedEvent.self),
            "stallEnded": playerEvent(StallEndedEvent.self),
            "timeChanged": playerEvent(TimeChangedEvent.self),
            "sourceLoad": activeSourceEvent(SourceLoadEvent.self),
            "sourceLoaded": activeSourceEvent(SourceLoadedEvent.self),
            "sourceUnloaded": activeSourceEvent(SourceUnloadedEvent.self),
            "sourceError": activeSourceEvent(SourceErrorEvent.self),
            "sourceWarning": activeSourceEvent(SourceWarningEvent.self),
            "audioAdded": activeSourceEvent(AudioAddedEvent.self),
            "audioChanged": activeSourceEvent(AudioChangedEvent.self),
            "audioRemoved": activeSourceEvent(AudioRemovedEvent.self),
            "subtitleAdded": activeSourceEvent(SubtitleAddedEvent.self),
            "subtitleChanged": activeSourceEvent(SubtitleChangedEvent.self),
            "subtitleRemoved": activeSourceEvent(SubtitleRemovedEvent.self),
            "downloadFinished": activeSourceEvent(DownloadFinishedEvent.self),
            "adBreakFinished": playerEvent(AdBreakFinishedEvent.self),
            "adBreakStarted": playerEvent(AdBreakStartedEvent.self),
            "adClicked": playerEvent(AdClickedEvent.self),
            "adError": playerEvent(AdErrorEvent.self),
            "adFinished": playerEvent(AdFinishedEvent.self),
            "adManifestLoad": playerEvent(AdManifestLoadEvent.self),
            "adManifestLoaded": playerEvent(AdManifestLoadedEvent.self),
            "adQuartile": playerEvent(AdQuartileEvent.self),
            "adScheduled": playerEvent(AdScheduledEvent.self),
            "adSkipped": playerEvent(AdSkippedEvent.self),
            "adStarted": playerEvent(AdStartedEvent.self),
            "nonLinearAdStarted": playerEvent(NonLinearAdStartedEvent.self),
            "nonLinearAdSkipped": playerEvent(NonLinearAdSkippedEvent.self),
            "nonLinearAdFinished": playerEvent(NonLinearAdFinishedEvent.self),
            "videoDownloadQualityChanged": activeSourceEvent(VideoDownloadQualityChangedEvent.self),
            // A source event on iOS, but a player event in `PlayerEventMap` as on Android.
            "videoPlaybackQualityChanged": activeSourceEvent(VideoPlaybackQualityChangedEvent.self),
            "cueEnter": playerEvent(CueEnterEvent.self),
            "cueExit": playerEvent(CueExitEvent.self),
            "metadata": playerEvent(MetadataEvent.self),
            "metadataParsed": activeSourceEvent(MetadataParsedEvent.self),
            "playbackSpeedChanged": playerEvent(PlaybackSpeedChangedEvent.self),
        ]
#if os(iOS)
        // Casting is only supported on iOS.
        subscribers.merge([
            "castAvailable": playerEvent(CastAvailableEvent.self),
            "castPaused": playerEvent(CastPausedEvent.self),
            "castPlaybackFinished": playerEvent(CastPlaybackFinishedEvent.self),
            "castPlaying": playerEvent(CastPlayingEvent.self),
            "castStarted": playerEvent(CastStartedEvent.self),
            "castStart": playerEvent(CastStartEvent.self),
            "castStopped": playerEvent(CastStoppedEvent.self),
            "castTimeUpdated": playerEvent(CastTimeUpdatedEvent.self),
            "castWaitingForDevice": playerEvent(CastWaitingForDeviceEvent.self),
        ]) { _, new in new }
#endif
        return subscribers
    }()

    /// All events a native `Source` emits.
    static let source: [String: EventSubscriber<Source>] = [
        "sourceLoad": sourceEvent(SourceLoadEvent.self),
        "sourceLoaded": sourceEvent(SourceLoadedEvent.self),
        "sourceUnloaded": sourceEvent(SourceUnloadedEvent.self),
        "sourceError": sourceEvent(SourceErrorEvent.self),
        "sourceWarning": sourceEvent(SourceWarningEvent.self),
        "audioAdded": sourceEvent(AudioAddedEvent.self),
        "audioChanged": sourceEvent(AudioChangedEvent.self),
        "audioRemoved": sourceEvent(AudioRemovedEvent.self),
        "subtitleAdded": sourceEvent(SubtitleAddedEvent.self),
        "subtitleChanged": sourceEvent(SubtitleChangedEvent.self),
        "subtitleRemoved": sourceEvent(SubtitleRemovedEvent.self),
        "downloadFinished": sourceEvent(DownloadFinishedEvent.self),
        "videoDownloadQualityChanged": sourceEvent(VideoDownloadQualityChangedEvent.self),
        "metadataParsed": sourceEvent(MetadataParsedEvent.self),
    ]

    private static func playerEvent<T: PlayerEvent>(_ eventType: T.Type) -> EventSubscriber<Player> {
        { player, forward in
            player.events.on(eventType).sink { forward($0) }
        }
    }

    private static func activeSourceEvent<T: SourceEvent>(_ eventType: T.Type) -> EventSubscriber<Player> {
        { player, forward in
            player.events.on(eventType).sink { forward($0) }
        }
    }

    private static func sourceEvent<T: SourceEvent>(_ eventType: T.Type) -> EventSubscriber<Source> {
        { source, forward in
            source.events.on(eventType).sink { forward($0) }
        }
    }
}
