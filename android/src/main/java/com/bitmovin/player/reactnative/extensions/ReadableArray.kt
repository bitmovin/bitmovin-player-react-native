package com.bitmovin.player.reactnative.extensions

import com.facebook.react.bridge.*

inline fun <reified T> ReadableArray.toList(): List<T?> = (0 until size()).map { i ->
    getDynamic(i).let {
        when (T::class) {
            Boolean::class -> it.asBoolean() as T
            String::class -> it.asString() as T
            Double::class -> it.asDouble() as T
            Int::class -> it.asInt() as T
            ReadableArray::class -> it.asArray() as T
            ReadableMap::class -> it.asMap() as T
            WritableArray::class -> it.asArray() as T
            WritableMap::class -> it.asMap() as T
            else -> null
        }
    }
}

inline fun <reified T> List<T>.toReadableArray(): ReadableArray = Arguments.createArray().apply {
    forEach {
        when (T::class) {
            Boolean::class -> pushBoolean(it as Boolean)
            String::class -> pushString(it as String)
            Double::class -> pushDouble(it as Double)
            Int::class -> pushInt(it as Int)
            ReadableArray::class -> pushArray(it as ReadableArray)
            ReadableMap::class -> pushMap(it as ReadableMap)
            WritableArray::class -> pushArray(it as ReadableArray)
            WritableMap::class -> pushMap(it as ReadableMap)
            else -> pushNull()
        }
    }
}
