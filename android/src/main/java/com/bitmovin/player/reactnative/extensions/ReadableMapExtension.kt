package com.bitmovin.player.reactnative.extensions

import com.facebook.react.bridge.*

fun ReadableMap.getBooleanOrNull(
    key: String,
): Boolean? = getValueOrNull(key, ReadableMap::getBoolean)

fun ReadableMap.getIntOrNull(
    key: String,
): Int? = getValueOrNull(key, ReadableMap::getInt)

inline fun <T> ReadableMap.getValueOrNull(
    key: String,
    get: ReadableMap.(String) -> T?,
) = takeIf { hasKey(key) }?.get(key)

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
): T? = mapValue(key, ReadableMap::getStringArray, block)

fun ReadableMap.getStringArray(it: String) = getArray(it)?.toStringList()

inline fun <T, R> ReadableMap.mapValue(
    key: String,
    get: ReadableMap.(String) -> T?,
    block: (T) -> R,
) = getValueOrNull(key, get)?.let(block)

inline fun <reified T> ReadableMap.toMap(): Map<String, T> = toHashMap().mapValues { it.value as T }
