package com.bitmovin.player.reactnative.extensions

import com.facebook.react.bridge.ReadableMap

fun ReadableMap.getBooleanOrNull(
    key: String,
): Boolean? = takeIf { hasKey(key) }?.getBoolean(key)

/**
 * Reads the [Boolean] value from the given [ReadableMap] if the [key] is present.
 * Returns the [default] value otherwise.
 */
fun ReadableMap.getOrDefault(
    key: String,
    default: Boolean,
) = if (hasKey(key)) getBoolean(key) else default

/**
 * Reads the [String] value from the given [ReadableMap] if the [key] is present.
 * Returns the [default] value otherwise.
 */
fun ReadableMap.getOrDefault(
    key: String,
    default: String?,
) = if (hasKey(key)) getString(key) else default
