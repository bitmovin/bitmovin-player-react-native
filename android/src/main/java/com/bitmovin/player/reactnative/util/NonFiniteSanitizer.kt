package com.bitmovin.player.reactnative.util

object NonFiniteSanitizer {
  fun sanitize(value: Any?): Any? = when (value) {
    null -> null
    is Double -> if (value.isFinite()) value else toSentinel(value)
    is Float -> {
      val d = value.toDouble()
      if (d.isFinite()) d else toSentinel(d)
    }
    is Map<*, *> -> value.entries.associate { (k, v) -> k.toString() to sanitize(v) }
    is List<*> -> value.map { sanitize(it) }
    is Array<*> -> value.map { sanitize(it) }
    is Number -> value // Int/Long/Short/Byte
    else -> value
  }

  /**
   * Type-safe method specifically for event data maps.
   * Sanitizes event data while preserving type safety and handling null filtering.
   */
  fun sanitizeEventData(
      eventData: Map<String, Any>
  ): Map<String, Any> = eventData.mapValues { sanitize(it) ?: it  }

  private fun toSentinel(d: Double): String = when {
    d == Double.POSITIVE_INFINITY -> "Infinity"
    d == Double.NEGATIVE_INFINITY -> "-Infinity"
    else -> "NaN"
  }
}
