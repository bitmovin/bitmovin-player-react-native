package com.bitmovin.player.reactnative

import com.bitmovin.player.api.event.Event
import com.bitmovin.player.api.event.EventListener
import com.bitmovin.player.api.event.JavaEventEmitter

/**
 * Attaches one native listener per instance and event name on demand and forwards the received
 * events via [forward]. Must only be used from the main thread.
 *
 * @param eventTypes The supported event classes, keyed by their React Native event name.
 */
class EventRelay<T : Event>(
    private val eventTypes: Map<String, Class<out T>>,
    private val forward: (NativeId, T) -> Unit,
) {
    private val listeners = mutableMapOf<NativeId, MutableMap<String, EventListener<T>>>()

    fun subscribe(nativeId: NativeId, emitter: JavaEventEmitter<T>, eventName: String) {
        val eventClass = eventTypes[eventName] ?: return
        val instanceListeners = listeners.getOrPut(nativeId) { mutableMapOf() }
        if (instanceListeners.containsKey(eventName)) return

        val listener = EventListener<T> { forward(nativeId, it) }
        @Suppress("UNCHECKED_CAST")
        emitter.on(eventClass as Class<T>, listener)
        instanceListeners[eventName] = listener
    }

    fun unsubscribe(nativeId: NativeId, emitter: JavaEventEmitter<T>?, eventName: String) {
        val listener = listeners[nativeId]?.remove(eventName) ?: return
        emitter?.off(listener)
    }

    fun unsubscribeAll(nativeId: NativeId, emitter: JavaEventEmitter<T>?) {
        val instanceListeners = listeners.remove(nativeId) ?: return
        emitter ?: return
        instanceListeners.values.forEach { emitter.off(it) }
    }

    /**
     * Detaches all native listeners, resolving each instance's emitter via [emitterOf].
     */
    fun clear(emitterOf: (NativeId) -> JavaEventEmitter<T>?) {
        listeners.forEach { (nativeId, instanceListeners) ->
            emitterOf(nativeId)?.let { emitter -> instanceListeners.values.forEach { emitter.off(it) } }
        }
        listeners.clear()
    }
}
