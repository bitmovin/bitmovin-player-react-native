package com.bitmovin.player.reactnative

import com.bitmovin.player.api.event.Event
import com.bitmovin.player.api.event.EventListener

/**
 * Data class representing an event subscription for Bitmovin Player events.
 * This class encapsulates the event class type and the corresponding action to be executed
 * when the event is triggered.
 *
 * @param eventClass The KClass of the event to subscribe to
 * @param eventListener The function to execute when the event is triggered
 */
data class EventSubscription<E : Event>(
    val eventClass: Class<out E>,
    val eventListener: EventListener<in E>,
)

inline fun <reified E : Event> EventSubscription(noinline action: (E) -> Unit) = EventSubscription(
    E::class.java,
    EventListener(action),
)
