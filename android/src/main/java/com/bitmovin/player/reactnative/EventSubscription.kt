package com.bitmovin.player.reactnative

import com.bitmovin.player.api.event.Event
import com.bitmovin.player.api.event.EventListener
import kotlin.reflect.KClass

/**
 * Data class representing an event subscription for Bitmovin Player events.
 * This class encapsulates the event class type and the corresponding action to be executed
 * when the event is triggered.
 *
 * @param eventClass The KClass of the event to subscribe to
 * @param action The function to execute when the event is triggered
 */
data class EventSubscription<E : Event> (
    val eventClass: KClass<out E>,
    val action: (E) -> Unit,
) : EventListener<E> {
    override fun onEvent(event: E) {
        action(event)
    }
}
