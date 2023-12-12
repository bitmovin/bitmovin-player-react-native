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

@JvmName("toReadableStringMap")
fun Map<String, String>.toReadableMap(): ReadableMap = toReadableMap(WritableMap::putString)
