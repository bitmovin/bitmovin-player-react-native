package com.bitmovin.player.reactnative

import com.bitmovin.player.api.event.Event
import com.bitmovin.player.api.event.EventListener
import com.bitmovin.player.api.event.JavaEventEmitter

/**
 * Attaches one native listener per instance and event name on demand and forwards the received
 * events via [forward]. Must only be used from the main thread.
 *
 * Subscriptions are counted: the native listener is attached on the first subscription and detached once the last
 * one is gone. This is necessary when the app creates several JS instances (e.g. `Player`s) with the same
 * `nativeId`, which each subscribe and unsubscribe on their own.
 *
 * @param eventTypes The supported event classes, keyed by their React Native event name.
 */
class EventRelay<T : Event>(
    private val eventTypes: Map<String, Class<out T>>,
    private val forward: (NativeId, T) -> Unit,
) {
    private class Subscription<T : Event>(val listener: EventListener<T>, var count: Int)

    private val subscriptions = mutableMapOf<NativeId, MutableMap<String, Subscription<T>>>()

    fun subscribe(nativeId: NativeId, emitter: JavaEventEmitter<T>, eventName: String) {
        val eventClass = eventTypes[eventName] ?: return
        val instanceSubscriptions = subscriptions.getOrPut(nativeId) { mutableMapOf() }
        instanceSubscriptions[eventName]?.let {
            it.count++
            return
        }

        val listener = EventListener<T> { forward(nativeId, it) }
        @Suppress("UNCHECKED_CAST")
        emitter.on(eventClass as Class<T>, listener)
        instanceSubscriptions[eventName] = Subscription(listener, count = 1)
    }

    fun unsubscribe(nativeId: NativeId, emitter: JavaEventEmitter<T>?, eventName: String) {
        val instanceSubscriptions = subscriptions[nativeId] ?: return
        val subscription = instanceSubscriptions[eventName] ?: return
        if (--subscription.count > 0) return
        instanceSubscriptions.remove(eventName)
        emitter?.off(subscription.listener)
    }

    fun unsubscribeAll(nativeId: NativeId, emitter: JavaEventEmitter<T>?) {
        val instanceSubscriptions = subscriptions.remove(nativeId) ?: return
        emitter ?: return
        instanceSubscriptions.values.forEach { emitter.off(it.listener) }
    }

    /**
     * Detaches all native listeners, resolving each instance's emitter via [emitterOf].
     */
    fun clear(emitterOf: (NativeId) -> JavaEventEmitter<T>?) {
        subscriptions.forEach { (nativeId, instanceSubscriptions) ->
            emitterOf(nativeId)?.let { emitter -> instanceSubscriptions.values.forEach { emitter.off(it.listener) } }
        }
        subscriptions.clear()
    }
}
