package com.bitmovin.player.reactnative.extensions

import com.facebook.react.bridge.ReadableMap

fun ReadableMap.getBooleanOrNull(
    key: String
): Boolean? = takeIf { hasKey(key) }?.getBoolean(key)
