package com.bitmovin.player.reactnative.extensions

import com.facebook.react.bridge.*

inline fun <T> ReadableArray.toList(convert: (Dynamic) -> T): List<T?> = (0 until size()).map { i ->
    convert(getDynamic(i))
}

fun ReadableArray.toBooleanList() = toList { it.asBoolean() }
fun ReadableArray.toStringList() = toList { it.asString() }
fun ReadableArray.toDoubleList() = toList { it.asDouble() }
fun ReadableArray.toIntList() = toList { it.asInt() }
fun ReadableArray.toListOfArrays() = toList { it.asArray() }
fun ReadableArray.toMapList() = toList { it.asMap() }

inline fun <reified T> List<T>.toReadableArray(): ReadableArray = Arguments.fromList(this)
