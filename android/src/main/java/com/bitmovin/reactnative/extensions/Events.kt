package com.bitmovin.reactnative.extensions
import com.bitmovin.player.api.event.PlayerEvent
import com.bitmovin.player.api.event.SourceEvent

fun PlayerEvent.getName(): String {
  if (this is PlayerEvent.Error || this is PlayerEvent.Warning) {
    return "onPlayer${this.javaClass.simpleName}"
  }
  return "on${this.javaClass.simpleName}"
}

fun SourceEvent.getName(): String {
  return "onSource${this.javaClass.simpleName}"
}