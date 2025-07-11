package com.bitmovin.player.reactnative

import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.bridge.WritableMap

/**
 * Utility functions for Expo modules integration with React Native bridge converters.
 */

/**
 * Converts a Map<String, Any?> to ReadableMap for compatibility with legacy converter methods.
 * This is needed because Expo modules use Map<String, Any?> while RN bridge converters expect ReadableMap.
 */
fun Map<String, Any?>.toReadableMap(): ReadableMap {
    val writableMap = Arguments.createMap()
    forEach { (key, value) ->
        when (value) {
            is String -> writableMap.putString(key, value)
            is Int -> writableMap.putInt(key, value)
            is Double -> writableMap.putDouble(key, value)
            is Float -> writableMap.putDouble(key, value.toDouble())
            is Boolean -> writableMap.putBoolean(key, value)
            is Map<*, *> -> {
                @Suppress("UNCHECKED_CAST")
                writableMap.putMap(key, (value as Map<String, Any?>).toReadableMap())
            }
            is List<*> -> {
                val array = Arguments.createArray()
                value.forEach { item ->
                    when (item) {
                        is String -> array.pushString(item)
                        is Int -> array.pushInt(item)
                        is Double -> array.pushDouble(item)
                        is Float -> array.pushDouble(item.toDouble())
                        is Boolean -> array.pushBoolean(item)
                        is Map<*, *> -> {
                            @Suppress("UNCHECKED_CAST")
                            array.pushMap((item as Map<String, Any?>).toReadableMap())
                        }
                    }
                }
                writableMap.putArray(key, array)
            }
            null -> writableMap.putNull(key)
        }
    }
    return writableMap
}