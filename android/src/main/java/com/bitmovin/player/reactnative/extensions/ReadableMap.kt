package com.bitmovin.player.reactnative.extensions

import com.facebook.react.bridge.*

inline fun <reified T> Map<String, T>.toReadableMap(): ReadableMap = Arguments.createMap().apply {
    forEach {
        when (T::class) {
            Boolean::class -> putBoolean(it.key, it.value as Boolean)
            String::class -> putString(it.key, it.value as String)
            Double::class -> putDouble(it.key, it.value as Double)
            Int::class -> putInt(it.key, it.value as Int)
            ReadableArray::class -> putArray(it.key, it.value as ReadableArray)
            ReadableMap::class -> putMap(it.key, it.value as ReadableMap)
            WritableArray::class -> putArray(it.key, it.value as ReadableArray)
            WritableMap::class -> putMap(it.key, it.value as ReadableMap)
            else -> putNull(it.key)
        }
    }
}
