package com.bitmovin.player.reactnative

import com.bitmovin.player.api.source.Source
import java.util.concurrent.ConcurrentHashMap

/**
 * Global registry for [Source] instances, allowing the [NativeId] of a native [Source] to be
 * resolved from anywhere in native code (e.g. when serializing events).
 */
object SourceRegistry {
    // Must be thread-safe: sources are registered and read on Expo's background queue
    // (e.g. `initializeWithConfig`, `duration`) and read on the main thread (e.g. `on`, `destroy`,
    // and when serializing events).
    private val sources: Registry<Source> = ConcurrentHashMap()

    fun register(nativeId: NativeId, source: Source) {
        sources[nativeId] = source
    }

    fun unregister(nativeId: NativeId) {
        sources.remove(nativeId)
    }

    fun getSource(nativeId: NativeId): Source? = sources[nativeId]

    /**
     * Resolves the [NativeId] of [source] by iterating all sources, as an app only has a few of them.
     */
    fun getNativeId(source: Source): NativeId? = sources.entries.firstOrNull { it.value === source }?.key

    fun clear() {
        sources.clear()
    }
}
