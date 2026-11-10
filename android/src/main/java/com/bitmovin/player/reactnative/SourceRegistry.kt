package com.bitmovin.player.reactnative

import com.bitmovin.player.api.source.Source
import java.util.concurrent.ConcurrentHashMap

/**
 * Global registry for [Source] instances, allowing the [NativeId] of a native [Source] to be
 * resolved from anywhere in native code (e.g. when serializing events).
 *
 * Each source is registered by an owner, e.g. a `SourceModule` instance, which can unregister all of its sources
 * without affecting the sources of another owner, e.g. of a new module instance after a reload.
 */
object SourceRegistry {
    private class Entry(val source: Source, val owner: Any)

    // Must be thread-safe: sources are registered and unregistered on the main thread, and read on the main
    // thread (e.g. `on` and when serializing events) and on Expo's background queue (e.g. `duration`).
    private val sources: Registry<Entry> = ConcurrentHashMap()

    fun register(nativeId: NativeId, source: Source, owner: Any) {
        sources[nativeId] = Entry(source, owner)
    }

    fun unregister(nativeId: NativeId) {
        sources.remove(nativeId)
    }

    fun getSource(nativeId: NativeId): Source? = sources[nativeId]?.source

    /**
     * Resolves the [NativeId] of [source] by iterating all sources, as an app only has a few of them.
     */
    fun getNativeId(source: Source): NativeId? = sources.entries.firstOrNull { it.value.source === source }?.key

    /**
     * Unregisters the sources registered by [owner].
     */
    fun unregisterAll(owner: Any) {
        sources.entries.removeIf { it.value.owner === owner }
    }
}
