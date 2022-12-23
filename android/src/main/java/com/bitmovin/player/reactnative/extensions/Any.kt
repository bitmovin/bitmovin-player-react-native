package com.bitmovin.player.reactnative.extensions

/**
 * Reflection helper for dynamically getting a property by name from a java object.
 * @param propertyName Property name.
 * @return A mutable property reference that can be used to get/set the prop's value.
 */
@Suppress("UNCHECKED_CAST")
inline fun <reified T> Any?.getProperty(propertyName: String): T? = this?.let {
    val getter = it::class.java.methods.firstOrNull { method ->
        method.name == "get${propertyName.capitalized()}"
    }
    getter?.invoke(it) as? T
}

/**
 * Reflection helper for dynamically setting a property value by name to a java object.
 * @param propertyName Property name.
 * @param value Value that will be set for the specified `propertyName`.
 */
@Suppress("UNCHECKED_CAST")
inline fun <reified T> Any?.setProperty(propertyName: String, value: T) = this?.let {
    val setter = it::class.java.methods.firstOrNull { method ->
        method.name == "set${propertyName.capitalized()}"
    }
    setter?.invoke(it, value)
}
