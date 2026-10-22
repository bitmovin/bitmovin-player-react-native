package com.bitmovin.player.reactnative

import com.bitmovin.player.api.ExperimentalBitmovinApi
import com.bitmovin.player.api.event.Event
import com.bitmovin.player.api.event.PlayerEvent
import com.bitmovin.player.api.event.SourceEvent

/**
 * Native event classes bridged to React Native, keyed by their React Native event name
 * (the event's `name` without the `on` prefix, e.g. `onPlayerActive` -> `playerActive`).
 */
object PlayerEventTypes {
    /**
     * All events a native `Player` emits, including the source events of its active source.
     */
    @OptIn(ExperimentalBitmovinApi::class)
    val player: Map<String, Class<out Event>> = linkedMapOf(
        "playerActive" to PlayerEvent.Active::class.java,
        "playerInactive" to PlayerEvent.Inactive::class.java,
        "playerError" to PlayerEvent.Error::class.java,
        "playerWarning" to PlayerEvent.Warning::class.java,
        "destroy" to PlayerEvent.Destroy::class.java,
        "muted" to PlayerEvent.Muted::class.java,
        "unmuted" to PlayerEvent.Unmuted::class.java,
        "ready" to PlayerEvent.Ready::class.java,
        "paused" to PlayerEvent.Paused::class.java,
        "play" to PlayerEvent.Play::class.java,
        "playing" to PlayerEvent.Playing::class.java,
        "playbackFinished" to PlayerEvent.PlaybackFinished::class.java,
        "seek" to PlayerEvent.Seek::class.java,
        "seeked" to PlayerEvent.Seeked::class.java,
        "timeShift" to PlayerEvent.TimeShift::class.java,
        "timeShifted" to PlayerEvent.TimeShifted::class.java,
        "stallStarted" to PlayerEvent.StallStarted::class.java,
        "stallEnded" to PlayerEvent.StallEnded::class.java,
        "timeChanged" to PlayerEvent.TimeChanged::class.java,
        "sourceLoad" to SourceEvent.Load::class.java,
        "sourceLoaded" to SourceEvent.Loaded::class.java,
        "sourceUnloaded" to SourceEvent.Unloaded::class.java,
        "sourceAdded" to PlayerEvent.SourceAdded::class.java,
        "sourceRemoved" to PlayerEvent.SourceRemoved::class.java,
        "playlistTransition" to PlayerEvent.PlaylistTransition::class.java,
        "sourceError" to SourceEvent.Error::class.java,
        "sourceWarning" to SourceEvent.Warning::class.java,
        "audioAdded" to SourceEvent.AudioTrackAdded::class.java,
        "audioChanged" to SourceEvent.AudioTrackChanged::class.java,
        "audioRemoved" to SourceEvent.AudioTrackRemoved::class.java,
        "subtitleAdded" to SourceEvent.SubtitleTrackAdded::class.java,
        "subtitleChanged" to SourceEvent.SubtitleTrackChanged::class.java,
        "subtitleRemoved" to SourceEvent.SubtitleTrackRemoved::class.java,
        "downloadFinished" to SourceEvent.DownloadFinished::class.java,
        "adBreakFinished" to PlayerEvent.AdBreakFinished::class.java,
        "adBreakStarted" to PlayerEvent.AdBreakStarted::class.java,
        "adClicked" to PlayerEvent.AdClicked::class.java,
        "adError" to PlayerEvent.AdError::class.java,
        "adFinished" to PlayerEvent.AdFinished::class.java,
        "adManifestLoad" to PlayerEvent.AdManifestLoad::class.java,
        "adManifestLoaded" to PlayerEvent.AdManifestLoaded::class.java,
        "adQuartile" to PlayerEvent.AdQuartile::class.java,
        "adScheduled" to PlayerEvent.AdScheduled::class.java,
        "adSkipped" to PlayerEvent.AdSkipped::class.java,
        "adStarted" to PlayerEvent.AdStarted::class.java,
        "nonLinearAdStarted" to PlayerEvent.NonLinearAdStarted::class.java,
        "nonLinearAdSkipped" to PlayerEvent.NonLinearAdSkipped::class.java,
        "nonLinearAdFinished" to PlayerEvent.NonLinearAdFinished::class.java,
        "videoDownloadQualityChanged" to SourceEvent.VideoDownloadQualityChanged::class.java,
        "videoPlaybackQualityChanged" to PlayerEvent.VideoPlaybackQualityChanged::class.java,
        "castAvailable" to PlayerEvent.CastAvailable::class.java,
        "castPaused" to PlayerEvent.CastPaused::class.java,
        "castPlaybackFinished" to PlayerEvent.CastPlaybackFinished::class.java,
        "castPlaying" to PlayerEvent.CastPlaying::class.java,
        "castStarted" to PlayerEvent.CastStarted::class.java,
        "castStart" to PlayerEvent.CastStart::class.java,
        "castStopped" to PlayerEvent.CastStopped::class.java,
        "castTimeUpdated" to PlayerEvent.CastTimeUpdated::class.java,
        "castWaitingForDevice" to PlayerEvent.CastWaitingForDevice::class.java,
        "cueEnter" to PlayerEvent.CueEnter::class.java,
        "cueExit" to PlayerEvent.CueExit::class.java,
        "metadata" to PlayerEvent.Metadata::class.java,
        "metadataParsed" to SourceEvent.MetadataParsed::class.java,
        "playbackSpeedChanged" to PlayerEvent.PlaybackSpeedChanged::class.java,
    )

    /**
     * All events a native `Source` emits.
     */
    @Suppress("UNCHECKED_CAST")
    val source: Map<String, Class<out SourceEvent>> = player
        .filterValues { SourceEvent::class.java.isAssignableFrom(it) } as Map<String, Class<out SourceEvent>>
}
