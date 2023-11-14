package com.bitmovin.player.reactnative.extensions

import com.facebook.react.bridge.*

/** Convert a [Map] to [ReadableMap], adding each [T] value using [put]. */
private inline fun <T> Map<String, T>.toReadableMap(
    put: WritableMap.(String, T) -> Unit,
): ReadableMap = Arguments.createMap().apply {
    forEach {
        put(it.key, it.value)
    }
}

fun Map<String, Boolean>.toReadableMap(): ReadableMap = toReadableMap(WritableMap::putBoolean)
fun Map<String, String>.toReadableMap(): ReadableMap = toReadableMap(WritableMap::putString)
fun Map<String, Double>.toReadableMap(): ReadableMap = toReadableMap(WritableMap::putDouble)
fun Map<String, Int>.toReadableMap(): ReadableMap = toReadableMap(WritableMap::putInt)
fun Map<String, ReadableArray>.toReadableMap(): ReadableMap = toReadableMap(WritableMap::putArray)
fun Map<String, ReadableMap>.toReadableMap(): ReadableMap = toReadableMap(WritableMap::putMap)
