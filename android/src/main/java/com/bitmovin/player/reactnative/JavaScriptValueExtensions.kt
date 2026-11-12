package com.bitmovin.player.reactnative

import expo.modules.kotlin.jni.JavaScriptObject
import expo.modules.kotlin.jni.JavaScriptValue

/** Snapshot SDK data on JS; function fields retain only Expo weak handles, not their closures. */
internal fun JavaScriptObject.toNativeConfig(): Map<String, Any?> = getPropertyNames().mapNotNull { key ->
    val value = getProperty(key)
    if (value.isUndefined()) null else key to value.toNativeValue()
}.toMap()

/** Decode returned DTOs while still on JS, before an SDK thread consumes them. */
internal fun JavaScriptValue.toNativeValue(): Any? = when {
    isNull() || isUndefined() -> null
    isBool() -> getBool()
    isNumber() -> getDouble()
    isString() -> getString()
    isFunction() -> getObject().createWeak()
    isArray() -> getArray().map { it.toNativeValue() }
    isObject() -> getObject().toNativeConfig()
    else -> null
}
