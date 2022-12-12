package com.bitmovin.player.reactnative.extensions

import kotlin.reflect.KMutableProperty
import kotlin.reflect.full.declaredMemberProperties

/**
 * Kotlin reflection helper for dynamically fetching properties from any object by its name.
 * @param propertyName Property name.
 * @return A mutable property reference that can be used to get/set the prop's value.
 */
@Suppress("UNCHECKED_CAST")
inline fun <reified T> Any?.getProperty(propertyName: String): KMutableProperty<T>? = this?.let {
    it::class.declaredMemberProperties.firstOrNull { member -> member.name == propertyName } as KMutableProperty<T>
}

/**
 * Kotlin reflection helper for dynamically setting the value of a property by its name.
 * @param propertyName Property name.
 * @param value Value that will be set for the specified `propertyName`.
 */
@Suppress("UNCHECKED_CAST")
inline fun <reified T> Any?.setProperty(propertyName: String, value: T) {
    if (this == null) {
        return
    }
    this.getProperty<T>(propertyName)?.setter?.call(this, value)
}
