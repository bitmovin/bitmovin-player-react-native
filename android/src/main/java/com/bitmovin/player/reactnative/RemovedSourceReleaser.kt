package com.bitmovin.player.reactnative

import android.os.Handler
import android.os.Looper
import com.bitmovin.player.api.Player
import com.bitmovin.player.api.event.PlayerEvent
import com.bitmovin.player.api.source.Source

/**
 * Releases a [Source] via [release] once a [Player] removed it, e.g. via `PlaylistApi.remove`, `Player.unload` or
 * a later load.
 *
 * The release is posted, so that the other listeners of the `SourceRemoved` event can still resolve the source.
 * Sources that are attached to a player again by then (e.g. reloaded) are not released.
 *
 * Must only be used on the main thread.
 */
class RemovedSourceReleaser(private val release: (NativeId) -> Unit) {
    private val handler = Handler(Looper.getMainLooper())
    private val listeners = mutableMapOf<NativeId, (PlayerEvent.SourceRemoved) -> Unit>()

    fun attach(nativeId: NativeId, player: Player) {
        val listener: (PlayerEvent.SourceRemoved) -> Unit = { handler.post { releaseIfDetached(it.source) } }
        listeners[nativeId] = listener
        player.on(PlayerEvent.SourceRemoved::class, listener)
    }

    fun detach(nativeId: NativeId, player: Player?) {
        val listener = listeners.remove(nativeId) ?: return
        player?.off(PlayerEvent.SourceRemoved::class, listener)
    }

    fun clear() {
        handler.removeCallbacksAndMessages(null)
        listeners.clear()
    }

    private fun releaseIfDetached(source: Source) {
        if (source.isAttachedToPlayer) return
        SourceRegistry.getNativeId(source)?.let(release)
    }
}
