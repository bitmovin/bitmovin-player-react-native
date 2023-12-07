package com.bitmovin.player.reactnative.extensions

import com.facebook.react.bridge.*

inline fun <T> ReadableArray.toList(getter: ReadableArray.(Int) -> T): List<T> = (0 until size()).map { i ->
    getter(i)
}

fun ReadableArray.toStringList() = toList(ReadableArray::getString)
fun ReadableArray.toMapList() = toList(ReadableArray::getMap)

inline fun <T> List<T>.mapToReactArray(
    transform: (T) -> WritableMap,
): WritableArray = Arguments.createArray().also {
    forEach { element -> it.pushMap(transform(element)) }
}
