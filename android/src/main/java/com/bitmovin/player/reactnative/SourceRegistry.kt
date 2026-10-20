package com.bitmovin.player.reactnative

import com.bitmovin.player.api.source.Source
import java.util.IdentityHashMap

/**
 * Global registry for [Source] instances, allowing the [NativeId] of a native [Source] to be
 * resolved from anywhere in native code (e.g. when serializing events).
 *
 * Keeps a reverse map by identity, so that resolving the [NativeId] of a [Source] does not scan all sources.
 */
object SourceRegistry {
    private val sources: Registry<Source> = mutableMapOf()
    private val nativeIds = IdentityHashMap<Source, NativeId>()

    @Synchronized
    fun register(nativeId: NativeId, source: Source) {
        sources.put(nativeId, source)?.let { nativeIds.remove(it, nativeId) }
        nativeIds[source] = nativeId
    }

    @Synchronized
    fun unregister(nativeId: NativeId) {
        sources.remove(nativeId)?.let { nativeIds.remove(it, nativeId) }
    }

    @Synchronized
    fun getSource(nativeId: NativeId): Source? = sources[nativeId]

    @Synchronized
    fun getNativeId(source: Source): NativeId? = nativeIds[source]

    @Synchronized
    fun clear() {
        sources.clear()
        nativeIds.clear()
    }
}
