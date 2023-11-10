package com.bitmovin.player.reactnative.extensions

import com.facebook.react.bridge.ReadableMap

fun ReadableMap.getBooleanOrNull(
    key: String,
): Boolean? = takeIf { hasKey(key) }?.getBoolean(key)

fun ReadableMap.getDoubleOrNull(
    key: String,
): Double? = takeIf { hasKey(key) }?.getDouble(key)

inline fun <T> ReadableMap.withDouble(
    key: String,
    block: (Double) -> T,
): T? = takeIf { hasKey(key) }?.getDouble(key)?.let(block)

inline fun <T> ReadableMap.withMap(
    key: String,
    block: (ReadableMap) -> T,
): T? = takeIf { hasKey(key) }?.getMap(key)?.let(block)

inline fun <T> ReadableMap.withInt(
    key: String,
    block: (Int) -> T,
): T? = takeIf { hasKey(key) }?.getInt(key)?.let(block)

inline fun <T> ReadableMap.withBoolean(
    key: String,
    block: (Boolean) -> T,
): T? = takeIf { hasKey(key) }?.getBoolean(key)?.let(block)

inline fun <T> ReadableMap.withString(
    key: String,
    block: (String) -> T,
): T? = getString(key)?.let(block)

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
