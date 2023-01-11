package com.bitmovin.player.reactnative.extensions

import com.facebook.react.bridge.ReactContext
import com.facebook.react.bridge.ReactContextBaseJavaModule

inline fun <reified T : ReactContextBaseJavaModule> ReactContext.getModule(): T? {
    return getNativeModule(T::class.java)
}
