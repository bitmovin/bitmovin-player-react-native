package com.bitmovin.player.reactnative.extensions

import com.facebook.react.bridge.WritableMap

fun WritableMap.putInt(key: String, i: Int?) {
    if (i == null) {
        putNull(key)
    } else {
        putInt(key, i)
    }
}

fun WritableMap.putDouble(key: String, d: Double?) {
    if (d == null) {
        putNull(key)
    } else {
        putDouble(key, d)
    }
}

fun WritableMap.putBoolean(key: String, b: Boolean?) {
    if (b == null) {
        putNull(key)
    } else {
        putBoolean(key, b)
    }
}
