package com.bitmovin.player.reactnative.extensions

import com.facebook.react.bridge.*

fun ReadableMap.getBooleanOrNull(
    key: String,
): Boolean? = takeIf { hasKey(key) }?.getBoolean(key)

inline fun <T> ReadableMap.withDouble(
    key: String,
    block: (Double) -> T,
): T? = mapValue(key, ReadableMap::getDouble, block)

inline fun <T> ReadableMap.withMap(
    key: String,
    block: (ReadableMap) -> T,
): T? = mapValue(key, ReadableMap::getMap, block)

inline fun <T> ReadableMap.withInt(
    key: String,
    block: (Int) -> T,
): T? = mapValue(key, ReadableMap::getInt, block)

inline fun <T> ReadableMap.withBoolean(
    key: String,
    block: (Boolean) -> T,
): T? = mapValue(key, ReadableMap::getBoolean, block)

inline fun <T> ReadableMap.withString(
    key: String,
    block: (String) -> T,
): T? = mapValue(key, ReadableMap::getString, block)

inline fun <T> ReadableMap.withArray(
    key: String,
    block: (ReadableArray) -> T,
): T? = mapValue(key, ReadableMap::getArray, block)

inline fun <T> ReadableMap.withStringArray(
    key: String,
    block: (List<String?>) -> T,
): T? = mapValue(key, { getArray(it)?.toStringList() }, block)

inline fun <T, R> ReadableMap.mapValue(
    key: String,
    get: ReadableMap.(String) -> T?,
    block: (T) -> R,
) = takeIf { hasKey(key) }?.get(key)?.let(block)

inline fun <reified T> ReadableMap.toMap(): Map<String, T> = toHashMap().mapValues { it.value as T }
