package com.bitmovin.player.reactnative.extensions

import com.facebook.react.bridge.ReadableArray
import com.facebook.react.bridge.ReadableMap

inline fun <reified T> ReadableArray.toList(): List<T?> = (0 until size()).map { i ->
    getDynamic(i).let {
        when (T::class) {
            Boolean::class -> it.asBoolean() as T
            String::class -> it.asString() as T
            Double::class -> it.asDouble() as T
            Int::class -> it.asInt() as T
            ReadableArray::class -> it.asArray() as T
            ReadableMap::class -> it.asMap() as T
            else -> null
        }
    }
}
