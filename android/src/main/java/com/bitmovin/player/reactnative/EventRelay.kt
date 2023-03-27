package com.bitmovin.player.reactnative

import com.bitmovin.player.api.event.Event
import com.bitmovin.player.api.event.EventEmitter
import kotlin.reflect.KClass

private data class Subscription<E : Event>(
    val eventClass: KClass<out E>,
    val action: (E) -> Unit,
)

/**
 * Attaches and detaches listener for the provided forwarding events on the current [EventEmitter] instance and
 * relays the received events together with their associated name to the provided event output.
 */
class EventRelay<E : EventEmitter<T>, T : Event>(
    /**
     * List of events that should be relayed and their associated name.
     */
    forwardingEventClassesAndNameMapping: Map<KClass<out T>, String>,
    /**
     * Is called for every relayed event together with its associated name.
     */
    private val eventOutput: (String, Event) -> Unit
) {
    private val eventListeners = forwardingEventClassesAndNameMapping.map {
        Subscription(it.key) { event -> eventOutput(it.value, event) }
    }

    /**
     * The [EventEmitter] for which the events are relayed.
     */
    var eventEmitter: E? = null
        set(value) {
            field?.detachListeners(eventListeners)
            field = value
            value?.attachListeners(eventListeners)
        }
}

private fun <T : Event, E : T> EventEmitter<T>.attachListeners(eventListener: List<Subscription<E>>) {
    eventListener.forEach { on(it.eventClass, it.action) }
}

private fun <T : Event, E : T> EventEmitter<T>.detachListeners(eventListener: List<Subscription<E>>) {
    eventListener.forEach { off(it.eventClass, it.action) }
}
