package com.bitmovin.player.reactnative

import com.bitmovin.player.api.source.Source
import java.util.concurrent.ConcurrentHashMap
import java.util.concurrent.atomic.AtomicInteger

/**
 * Global registry for [Source] instances, allowing the [NativeId] of a native [Source] to be
 * resolved from anywhere in native code (e.g. when serializing events).
 *
 * Each source is registered by an owner, e.g. a `SourceModule` instance, which can unregister all of its sources
 * without affecting the sources of another owner, e.g. of a new module instance after a reload.
 *
 * Each registration gets a new instance id, which tells a source created again for the same [NativeId] apart from
 * the released one.
 */
object SourceRegistry {
    private class Entry(val source: Source, val owner: Any, val instanceId: Int)

    private val nextInstanceId = AtomicInteger(0)

    // Must be thread-safe: sources are registered and read on Expo's background queue
    // (e.g. `initializeWithConfig`, `duration`) and read on the main thread (e.g. `on`, `destroy`,
    // and when serializing events).
    private val sources: Registry<Entry> = ConcurrentHashMap()

    /**
     * @return The instance id of this registration.
     */
    fun register(nativeId: NativeId, source: Source, owner: Any): Int {
        val instanceId = nextInstanceId.getAndIncrement()
        sources[nativeId] = Entry(source, owner, instanceId)
        return instanceId
    }

    /**
     * @return The instance id of the removed registration, or `null` if [nativeId] was not registered.
     */
    fun unregister(nativeId: NativeId): Int? = sources.remove(nativeId)?.instanceId

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
