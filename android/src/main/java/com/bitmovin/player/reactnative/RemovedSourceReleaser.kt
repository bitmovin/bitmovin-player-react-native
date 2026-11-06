package com.bitmovin.player.reactnative

import android.os.Handler
import android.os.Looper
import com.bitmovin.player.api.Player
import com.bitmovin.player.api.event.PlayerEvent
import com.bitmovin.player.api.source.Source
import java.util.Collections
import java.util.IdentityHashMap

/**
 * Releases a [Source] via [release] once a [Player] removed it, e.g. via `PlaylistApi.remove`, `Player.unload`,
 * a later load or `Player.destroy`.
 *
 * The release is posted, so that the other listeners of the `SourceRemoved` event can still resolve the source.
 * Sources that are attached to a player again by then (e.g. reloaded) or [kept][keep] are not released.
 *
 * Must only be used on the main thread.
 */
class RemovedSourceReleaser(private val release: (NativeId) -> Unit) {
    private val handler = Handler(Looper.getMainLooper())
    private val listeners = mutableMapOf<NativeId, (PlayerEvent.SourceRemoved) -> Unit>()
    private val pendingReleases = Collections.newSetFromMap(IdentityHashMap<Source, Boolean>())

    fun attach(nativeId: NativeId, player: Player) {
        val listener: (PlayerEvent.SourceRemoved) -> Unit = { scheduleRelease(it.source) }
        listeners[nativeId] = listener
        player.on(PlayerEvent.SourceRemoved::class, listener)
    }

    fun detach(nativeId: NativeId, player: Player?) {
        val listener = listeners.remove(nativeId) ?: return
        player?.off(PlayerEvent.SourceRemoved::class, listener)
    }

    /**
     * Keeps [source] if its release is pending, e.g. because it is initialized again right after it was removed.
     */
    fun keep(source: Source) {
        pendingReleases.remove(source)
    }

    /**
     * Detaches all listeners, resolving each player via [playerOf], and drops pending releases.
     */
    fun clear(playerOf: (NativeId) -> Player?) {
        handler.removeCallbacksAndMessages(null)
        listeners.keys.toList().forEach { detach(it, playerOf(it)) }
        pendingReleases.clear()
    }

    private fun scheduleRelease(source: Source) {
        pendingReleases.add(source)
        handler.post {
            if (pendingReleases.remove(source) && !source.isAttachedToPlayer) {
                SourceRegistry.getNativeId(source)?.let(release)
            }
        }
    }
}
