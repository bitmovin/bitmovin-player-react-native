package com.bitmovin.player.reactnative

import com.bitmovin.player.api.Player
import com.bitmovin.player.api.event.Event
import kotlin.reflect.KClass

/**
 * Attaches and detaches listener for the provided forwarding events on the current [Player] instance and
 * relays the received events together with their associated name to the provided event output.
 */
class PlayerEventRelay(
    /**
     * List of events that should be relayed and their associated name.
     */
    forwardingEventClassesAndNameMapping: Map<KClass<out Event>, String>,
    /**
     * Is called for every relayed event together with its associated name.
     */
    private val eventOutput: (String, Event) -> Unit
) {
    private val playerEventListenersMap = mutableMapOf<KClass<out Event>, (Event) -> Unit>()
    /**
     * The [Player] for which the events are relayed.
     */
    var player: Player? = null
        set(value) {
            field?.detachListeners(playerEventListenersMap)
            field = value
            value?.attachListeners(playerEventListenersMap)
        }

    init {
        forwardingEventClassesAndNameMapping.forEach {
            playerEventListenersMap[it.key] = { event -> eventOutput(it.value, event) }
        }
    }
}

private fun Player.attachListeners(eventListener: Map<KClass<out Event>, (Event) -> Unit>) {
    eventListener.forEach { on(it.key, it.value) }
}

private fun Player.detachListeners(eventListener: Map<KClass<out Event>, (Event) -> Unit>) {
    eventListener.forEach { off(it.key, it.value) }
}
