package com.bitmovin.player.reactnative.extensions

import com.facebook.react.bridge.ReadableArray
import com.facebook.react.bridge.ReadableMap

fun ReadableMap.getBooleanOrNull(
    key: String,
): Boolean? = takeIf { hasKey(key) }?.getBoolean(key)

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

inline fun <T> ReadableMap.withArray(
    key: String,
    block: (ReadableArray) -> T,
): T? = getArray(key)?.let(block)

inline fun <T> ReadableMap.withStringArray(
    key: String,
    block: (List<String?>) -> T,
): T? = getArray(key)?.toStringList()?.let(block)
