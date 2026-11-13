package com.bitmovin.player.reactnative

import expo.modules.kotlin.jni.JavaScriptObject
import expo.modules.kotlin.jni.JavaScriptValue
import expo.modules.kotlin.jni.JavaScriptWeakObject

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
    isFunction() -> createWeak()
    isArray() -> getArray().map { it.toNativeValue() }
    isObject() -> getObject().toNativeConfig()
    else -> null
}

internal fun JavaScriptObject.getWeakCallback(key: String): JavaScriptWeakObject? = getProperty(key).createWeak()

/** Keep configured callbacks weak: their closures can capture the JS owner and its native peer. */
private fun JavaScriptValue.createWeak(): JavaScriptWeakObject? =
    takeIf { it.isFunction() }?.getObject()?.createWeak()
