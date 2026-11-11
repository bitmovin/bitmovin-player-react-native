package com.bitmovin.player.reactnative

import com.bitmovin.player.api.event.EventEmitter
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

internal fun SharedObject.observeSourceEvents(source: EventEmitter<in SourceEvent>) {
    val owner = WeakReference(this)
    source.on(SourceEvent.Load::class) { owner.get()?.forwardEvent(it.toJson()) }
    source.on(SourceEvent.Loaded::class) { owner.get()?.forwardEvent(it.toJson()) }
    source.on(SourceEvent.Unloaded::class) { owner.get()?.forwardEvent(it.toJson()) }
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
