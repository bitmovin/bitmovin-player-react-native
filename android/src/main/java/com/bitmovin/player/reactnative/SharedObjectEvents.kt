package com.bitmovin.player.reactnative

import com.bitmovin.player.api.ExperimentalBitmovinApi
import com.bitmovin.player.api.event.Event
import com.bitmovin.player.api.event.EventEmitter
import com.bitmovin.player.api.event.PlayerEvent
import com.bitmovin.player.api.event.SourceEvent
import com.bitmovin.player.reactnative.converter.toJson
import com.bitmovin.player.reactnative.util.NonFiniteSanitizer
import expo.modules.kotlin.sharedobjects.SharedObject
import java.lang.ref.WeakReference

/** Forward SDK events without retaining the SharedObject from its SDK object. */
internal fun SharedObject.forwardEvent(eventData: Map<String, Any>) {
    val payload = NonFiniteSanitizer.sanitizeEventData(eventData)
    val name = (payload["name"] as String).removePrefix("on").replaceFirstChar { it.lowercase() }
    emit(name, payload)
    emit("event", payload)
}

@OptIn(ExperimentalBitmovinApi::class)
internal fun SharedObject.observePlayerEvents(player: EventEmitter<Event>) {
    val owner = WeakReference(this)
    player.on(PlayerEvent.Active::class) { owner.get()?.forwardEvent(it.toJson()) }
    player.on(PlayerEvent.Inactive::class) { owner.get()?.forwardEvent(it.toJson()) }
    player.on(PlayerEvent.Error::class) { owner.get()?.forwardEvent(it.toJson()) }
    player.on(PlayerEvent.Warning::class) { owner.get()?.forwardEvent(it.toJson()) }
    player.on(PlayerEvent.Destroy::class) { owner.get()?.forwardEvent(it.toJson()) }
    player.on(PlayerEvent.Muted::class) { owner.get()?.forwardEvent(it.toJson()) }
    player.on(PlayerEvent.Unmuted::class) { owner.get()?.forwardEvent(it.toJson()) }
    player.on(PlayerEvent.Ready::class) { owner.get()?.forwardEvent(it.toJson()) }
    player.on(PlayerEvent.Paused::class) { owner.get()?.forwardEvent(it.toJson()) }
    player.on(PlayerEvent.Play::class) { owner.get()?.forwardEvent(it.toJson()) }
    player.on(PlayerEvent.Playing::class) { owner.get()?.forwardEvent(it.toJson()) }
    player.on(PlayerEvent.PlaybackFinished::class) { owner.get()?.forwardEvent(it.toJson()) }
    player.on(PlayerEvent.SourceAdded::class) { owner.get()?.forwardEvent(it.toJson()) }
    player.on(PlayerEvent.SourceRemoved::class) { owner.get()?.forwardEvent(it.toJson()) }
    player.on(PlayerEvent.PlaylistTransition::class) { owner.get()?.forwardEvent(it.toJson()) }
    player.on(PlayerEvent.Seek::class) { owner.get()?.forwardEvent(it.toJson()) }
    player.on(PlayerEvent.Seeked::class) { owner.get()?.forwardEvent(it.toJson()) }
    player.on(PlayerEvent.TimeShift::class) { owner.get()?.forwardEvent(it.toJson()) }
    player.on(PlayerEvent.TimeShifted::class) { owner.get()?.forwardEvent(it.toJson()) }
    player.on(PlayerEvent.StallStarted::class) { owner.get()?.forwardEvent(it.toJson()) }
    player.on(PlayerEvent.StallEnded::class) { owner.get()?.forwardEvent(it.toJson()) }
    player.on(PlayerEvent.TimeChanged::class) { owner.get()?.forwardEvent(it.toJson()) }
    player.on(PlayerEvent.AdBreakFinished::class) { owner.get()?.forwardEvent(it.toJson()) }
    player.on(PlayerEvent.AdBreakStarted::class) { owner.get()?.forwardEvent(it.toJson()) }
    player.on(PlayerEvent.AdClicked::class) { owner.get()?.forwardEvent(it.toJson()) }
    player.on(PlayerEvent.AdError::class) { owner.get()?.forwardEvent(it.toJson()) }
    player.on(PlayerEvent.AdFinished::class) { owner.get()?.forwardEvent(it.toJson()) }
    player.on(PlayerEvent.AdManifestLoad::class) { owner.get()?.forwardEvent(it.toJson()) }
    player.on(PlayerEvent.AdManifestLoaded::class) { owner.get()?.forwardEvent(it.toJson()) }
    player.on(PlayerEvent.AdQuartile::class) { owner.get()?.forwardEvent(it.toJson()) }
    player.on(PlayerEvent.AdScheduled::class) { owner.get()?.forwardEvent(it.toJson()) }
    player.on(PlayerEvent.AdSkipped::class) { owner.get()?.forwardEvent(it.toJson()) }
    player.on(PlayerEvent.AdStarted::class) { owner.get()?.forwardEvent(it.toJson()) }
    player.on(PlayerEvent.NonLinearAdStarted::class) { owner.get()?.forwardEvent(it.toJson()) }
    player.on(PlayerEvent.NonLinearAdSkipped::class) { owner.get()?.forwardEvent(it.toJson()) }
    player.on(PlayerEvent.NonLinearAdFinished::class) { owner.get()?.forwardEvent(it.toJson()) }
    player.on(PlayerEvent.VideoPlaybackQualityChanged::class) { owner.get()?.forwardEvent(it.toJson()) }
    player.on(PlayerEvent.CastAvailable::class) { owner.get()?.forwardEvent(it.toJson()) }
    player.on(PlayerEvent.CastPaused::class) { owner.get()?.forwardEvent(it.toJson()) }
    player.on(PlayerEvent.CastPlaybackFinished::class) { owner.get()?.forwardEvent(it.toJson()) }
    player.on(PlayerEvent.CastPlaying::class) { owner.get()?.forwardEvent(it.toJson()) }
    player.on(PlayerEvent.CastStarted::class) { owner.get()?.forwardEvent(it.toJson()) }
    player.on(PlayerEvent.CastStart::class) { owner.get()?.forwardEvent(it.toJson()) }
    player.on(PlayerEvent.CastStopped::class) { owner.get()?.forwardEvent(it.toJson()) }
    player.on(PlayerEvent.CastTimeUpdated::class) { owner.get()?.forwardEvent(it.toJson()) }
    player.on(PlayerEvent.CastWaitingForDevice::class) { owner.get()?.forwardEvent(it.toJson()) }
    player.on(PlayerEvent.CueEnter::class) { owner.get()?.forwardEvent(it.toJson()) }
    player.on(PlayerEvent.CueExit::class) { owner.get()?.forwardEvent(it.toJson()) }
    player.on(PlayerEvent.Metadata::class) { owner.get()?.forwardEvent(it.toJson()) }
    player.on(PlayerEvent.PlaybackSpeedChanged::class) { owner.get()?.forwardEvent(it.toJson()) }
    observeSourceEvents(player)
}

internal fun SharedObject.observeSourceEvents(source: EventEmitter<in SourceEvent>) {
    val owner = WeakReference(this)
    source.on(SourceEvent.Load::class) { owner.get()?.forwardEvent(it.toJson()) }
    source.on(SourceEvent.Loaded::class) { owner.get()?.forwardEvent(it.toJson()) }
    source.on(SourceEvent.Unloaded::class) {
        val target = owner.get() ?: return@on
        val payload = it.toJson().toMutableMap()
        if (target is SharedSource) payload["source"] = target.source.toJson()
        target.forwardEvent(payload)
    }
    source.on(SourceEvent.Error::class) { owner.get()?.forwardEvent(it.toJson()) }
    source.on(SourceEvent.Warning::class) { owner.get()?.forwardEvent(it.toJson()) }
    source.on(SourceEvent.AudioTrackAdded::class) { owner.get()?.forwardEvent(it.toJson()) }
    source.on(SourceEvent.AudioTrackChanged::class) { owner.get()?.forwardEvent(it.toJson()) }
    source.on(SourceEvent.AudioTrackRemoved::class) { owner.get()?.forwardEvent(it.toJson()) }
    source.on(SourceEvent.SubtitleTrackAdded::class) { owner.get()?.forwardEvent(it.toJson()) }
    source.on(SourceEvent.SubtitleTrackChanged::class) { owner.get()?.forwardEvent(it.toJson()) }
    source.on(SourceEvent.SubtitleTrackRemoved::class) { owner.get()?.forwardEvent(it.toJson()) }
    source.on(SourceEvent.DownloadFinished::class) { owner.get()?.forwardEvent(it.toJson()) }
    source.on(SourceEvent.VideoDownloadQualityChanged::class) { owner.get()?.forwardEvent(it.toJson()) }
    source.on(SourceEvent.MetadataParsed::class) { owner.get()?.forwardEvent(it.toJson()) }
}
