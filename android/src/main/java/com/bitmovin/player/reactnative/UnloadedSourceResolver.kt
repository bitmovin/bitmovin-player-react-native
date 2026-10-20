package com.bitmovin.player.reactnative

import com.bitmovin.player.api.Player
import com.bitmovin.player.api.event.PlayerEvent
import com.bitmovin.player.api.event.SourceEvent
import com.bitmovin.player.api.source.Source
import java.util.IdentityHashMap

/**
 * Resolves the [Source] of a [SourceEvent.Unloaded] that a [Player] emits.
 *
 * The native event does not carry the unloaded source. Native emits the same event instance first on the
 * unloaded source and then on the player, so the source is remembered when it emits the event and looked up
 * by identity when the player relays it.
 *
 * Must only be used on the main thread.
 */
class UnloadedSourceResolver {
    private val playerListeners = mutableMapOf<NativeId, PlayerListeners>()
    private val sourceListeners = IdentityHashMap<Source, (SourceEvent.Unloaded) -> Unit>()
    private var lastUnloadedEvent: SourceEvent.Unloaded? = null
    private var lastUnloadedSource: Source? = null

    private class PlayerListeners(
        val onSourceAdded: (PlayerEvent.SourceAdded) -> Unit,
        val onSourceRemoved: (PlayerEvent.SourceRemoved) -> Unit,
    )

    fun attach(nativeId: NativeId, player: Player) {
        val listeners = PlayerListeners(
            onSourceAdded = { track(it.source) },
            onSourceRemoved = { untrack(it.source) },
        )
        playerListeners[nativeId] = listeners
        player.on(PlayerEvent.SourceAdded::class, listeners.onSourceAdded)
        player.on(PlayerEvent.SourceRemoved::class, listeners.onSourceRemoved)
    }

    fun detach(nativeId: NativeId, player: Player?) {
        val listeners = playerListeners.remove(nativeId) ?: return
        player?.off(PlayerEvent.SourceAdded::class, listeners.onSourceAdded)
        player?.off(PlayerEvent.SourceRemoved::class, listeners.onSourceRemoved)
    }

    fun resolve(event: SourceEvent.Unloaded): Source? = lastUnloadedSource.takeIf { lastUnloadedEvent === event }

    fun clear() {
        playerListeners.clear()
        sourceListeners.clear()
        lastUnloadedEvent = null
        lastUnloadedSource = null
    }

    private fun track(source: Source) {
        if (sourceListeners.containsKey(source)) return
        val listener: (SourceEvent.Unloaded) -> Unit = {
            lastUnloadedEvent = it
            lastUnloadedSource = source
        }
        sourceListeners[source] = listener
        source.on(SourceEvent.Unloaded::class, listener)
    }

    // Native emits `SourceRemoved` after the `Unloaded` of the removed source.
    private fun untrack(source: Source) {
        sourceListeners.remove(source)?.let { source.off(SourceEvent.Unloaded::class, it) }
        if (lastUnloadedSource === source) {
            lastUnloadedEvent = null
            lastUnloadedSource = null
        }
    }
}
