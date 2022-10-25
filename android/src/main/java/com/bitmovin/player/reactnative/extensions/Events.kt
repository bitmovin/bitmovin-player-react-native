package com.bitmovin.player.reactnative.extensions

import com.bitmovin.player.api.event.PlayerEvent
import com.bitmovin.player.api.event.SourceEvent

fun PlayerEvent.getName(): String {
    if (this is PlayerEvent.Error || this is PlayerEvent.Warning) {
        return "onPlayer${this.javaClass.simpleName}"
    }
    return "on${this.javaClass.simpleName}"
}

/**
 * TODO: Until a certain point, all source events supported by this library followed the pattern
 *  `onSource{EventName}`. But it's necessary to improve the way how event names are dynamically
 *   computed based on the event type so they can match the same names provided by iOS and possibly
 *   other platforms.
 */
fun SourceEvent.getName(): String = when (this) {
    is SourceEvent.AudioTrackAdded -> "onAudioAdded"
    is SourceEvent.AudioTrackChanged -> "onAudioChanged"
    is SourceEvent.AudioTrackRemoved -> "onAudioRemoved"
    is SourceEvent.SubtitleTrackAdded -> "onSubtitleAdded"
    is SourceEvent.SubtitleTrackChanged -> "onSubtitleChanged"
    is SourceEvent.SubtitleTrackRemoved -> "onSubtitleRemoved"
    else -> "onSource${this.javaClass.simpleName}"
}
