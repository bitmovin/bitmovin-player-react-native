package com.bitmovin.player.reactnative.util

object NonFiniteSanitizer {
    /**
     * Type-safe method specifically for event data maps.
     * Sanitizes event data while preserving type safety and handling null filtering.
     */
    fun sanitizeEventData(
        eventData: Map<String, Any>,
    ): Map<String, Any> = eventData.mapValues { sanitize(it.value) ?: it.value }

    private fun sanitize(value: Any?): Any? = when (value) {
        null -> null
        is Double -> if (value.isFinite()) value else value.toSentinel()
        is Float -> if (value.isFinite()) value else value.toSentinel()
        is Map<*, *> -> value.mapValues { sanitize(it.value) }
        is List<*> -> value.mapNotNull { sanitize(it) }
        is Array<*> -> value.mapNotNull { sanitize(it) }
        is Number -> value // Int/Long/Short/Byte
        else -> value
    }
}

private fun Double.toSentinel(): String = when (this) {
    Double.POSITIVE_INFINITY -> "Infinity"
    Double.NEGATIVE_INFINITY -> "-Infinity"
    else -> "NaN"
}

private fun Float.toSentinel(): String = when (this) {
    Float.POSITIVE_INFINITY -> "Infinity"
    Float.NEGATIVE_INFINITY -> "-Infinity"
    else -> "NaN"
}