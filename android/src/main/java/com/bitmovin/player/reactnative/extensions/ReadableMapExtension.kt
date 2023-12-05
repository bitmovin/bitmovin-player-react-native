package com.bitmovin.player.reactnative.extensions

import com.facebook.react.bridge.*
import java.security.InvalidParameterException

fun ReadableMap.getBooleanOrNull(key: String): Boolean? = getValueOrNull(key, ReadableMap::getBoolean)
fun ReadableMap.getIntOrNull(key: String): Int? = getValueOrNull(key, ReadableMap::getInt)
fun ReadableMap.getDoubleOrNull(key: String): Double? = getValueOrNull(key, ReadableMap::getDouble)

fun ReadableMap.getArrayOrThrow(key: String) = getObjectOrThrow(key, "array", ReadableMap::getArray)
fun ReadableMap.getMapOrThrow(key: String) = getObjectOrThrow(key, "map", ReadableMap::getMap)
fun ReadableMap.getStringOrThrow(key: String) = getObjectOrThrow(key, "string", ReadableMap::getString)

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

fun ReadableMap.getStringArray(it: String): List<String?>? = getArray(it)?.toStringList()

inline fun <reified T> ReadableMap.toMap(): Map<String, T> = toHashMap().mapValues { it.value as T }

/** Private helper, do not use directly. */
inline fun <T, R> ReadableMap.mapValue(
    key: String,
    get: ReadableMap.(String) -> T?,
    block: (T) -> R,
) = getValueOrNull(key, get)?.let(block)

/** Private helper, do not use directly. */
inline fun <T> ReadableMap.getValueOrNull(
    key: String,
    get: ReadableMap.(String) -> T?,
) = takeIf { hasKey(key) }?.get(key)

private inline fun <T> ReadableMap.getObjectOrThrow(
    key: String,
    name: String,
    getter: ReadableMap.(String) -> T?,
) = getter(key) ?: throw InvalidParameterException("Missing $name $key")
