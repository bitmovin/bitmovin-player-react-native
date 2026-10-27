package com.bitmovin.player.reactnative

import android.os.Handler
import android.os.Looper
import com.bitmovin.player.api.Player
import com.bitmovin.player.api.event.PlayerEvent
import com.bitmovin.player.api.event.SourceEvent
import com.bitmovin.player.api.source.Source
import java.util.Collections
import java.util.IdentityHashMap

/**
 * Tracks the [Source]s of the attached [Player]s:
 * - Resolves the source of a [SourceEvent.Unloaded] that a player emits. The native event does not carry the
 *   unloaded source. Native emits the same event instance first on the unloaded source and then on the player, so
 *   the source is remembered when it emits the event and looked up by identity when the player relays it.
 * - Releases a source via [release] once a player removed it, e.g. via `PlaylistApi.remove`, `Player.unload`, a
 *   later load or `Player.destroy`. The release is posted, so that the other listeners of the `SourceRemoved` event
 *   can still resolve the source. Sources that are attached to a player again by then (e.g. reloaded) or [kept][keep]
 *   are not released.
 *
 * Must only be used on the main thread.
 */
class PlayerSourceTracker(private val release: (NativeId) -> Unit) {
    private val handler = Handler(Looper.getMainLooper())
    private val playerListeners = mutableMapOf<NativeId, PlayerListeners>()
    private val unloadedListeners = IdentityHashMap<Source, (SourceEvent.Unloaded) -> Unit>()
    private val pendingReleases = Collections.newSetFromMap(IdentityHashMap<Source, Boolean>())
    private var lastUnloadedEvent: SourceEvent.Unloaded? = null
    private var lastUnloadedSource: Source? = null

    private class PlayerListeners(
        val onSourceAdded: (PlayerEvent.SourceAdded) -> Unit,
        val onSourceRemoved: (PlayerEvent.SourceRemoved) -> Unit,
    )

    fun attach(nativeId: NativeId, player: Player) {
        val listeners = PlayerListeners(
            onSourceAdded = { track(it.source) },
            onSourceRemoved = { onSourceRemoved(it.source) },
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

    fun resolveUnloadedSource(event: SourceEvent.Unloaded): Source? =
        lastUnloadedSource.takeIf { lastUnloadedEvent === event }

    /**
     * Keeps [source] if its release is pending, e.g. because it is initialized again right after it was removed.
     */
    fun keep(source: Source) {
        pendingReleases.remove(source)
    }

    fun clear() {
        handler.removeCallbacksAndMessages(null)
        playerListeners.clear()
        pendingReleases.clear()
        unloadedListeners.clear()
        lastUnloadedEvent = null
        lastUnloadedSource = null
    }

    private fun track(source: Source) {
        if (unloadedListeners.containsKey(source)) return
        val listener: (SourceEvent.Unloaded) -> Unit = {
            lastUnloadedEvent = it
            lastUnloadedSource = source
        }
        unloadedListeners[source] = listener
        source.on(SourceEvent.Unloaded::class, listener)
    }

    // Native emits `SourceRemoved` after the `Unloaded` of the removed source.
    private fun onSourceRemoved(source: Source) {
        unloadedListeners.remove(source)?.let { source.off(SourceEvent.Unloaded::class, it) }
        if (lastUnloadedSource === source) {
            lastUnloadedEvent = null
            lastUnloadedSource = null
        }
        pendingReleases.add(source)
        handler.post {
            if (pendingReleases.remove(source) && !source.isAttachedToPlayer) {
                SourceRegistry.getNativeId(source)?.let(release)
            }
        }
    }
}
