package com.bitmovin.player.reactnative.extensions

fun List<Any?>.getBooleanOrNull(index: Int): Boolean? = 
    if (index in indices) get(index) as? Boolean else null

fun List<Any?>.getIntOrNull(index: Int): Int? = 
    if (index in indices) (get(index) as? Number)?.toInt() else null

fun List<Any?>.getInt(index: Int): Int = 
    if (index in indices) (get(index) as? Number)?.toInt() ?: 0 else 0

fun List<Any?>.getDoubleOrNull(index: Int): Double? = 
    if (index in indices) (get(index) as? Number)?.toDouble() else null

fun List<Any?>.getString(index: Int): String? = 
    if (index in indices) get(index) as? String else null

fun List<Any?>.getMap(index: Int): Map<String, Any?>? = 
    if (index in indices) get(index) as? Map<String, Any?> else null

fun List<Any?>.getArray(index: Int): List<Any?>? = 
    if (index in indices) get(index) as? List<Any?> else null

inline fun <T> List<Any?>.withDouble(
    index: Int,
    block: (Double) -> T,
): T? {
    val value = if (index in indices) (get(index) as? Number)?.toDouble() else null
    return if (value != null) block(value) else null
}

inline fun <T> List<Any?>.withMap(
    index: Int,
    block: (Map<String, Any?>) -> T,
): T? {
    val value = if (index in indices) get(index) as? Map<String, Any?> else null
    return if (value != null) block(value) else null
}

inline fun <T> List<Any?>.withInt(
    index: Int,
    block: (Int) -> T,
): T? {
    val value = if (index in indices) (get(index) as? Number)?.toInt() else null
    return if (value != null) block(value) else null
}

inline fun <T> List<Any?>.withBoolean(
    index: Int,
    block: (Boolean) -> T,
): T? {
    val value = if (index in indices) get(index) as? Boolean else null
    return if (value != null) block(value) else null
}

inline fun <T> List<Any?>.withString(
    index: Int,
    block: (String) -> T,
): T? {
    val value = if (index in indices) get(index) as? String else null
    return if (value != null) block(value) else null
}

inline fun <T> List<Any?>.withArray(
    index: Int,
    block: (List<Any?>) -> T,
): T? {
    val value = if (index in indices) get(index) as? List<Any?> else null
    return if (value != null) block(value) else null
}

inline fun <T> List<Any?>.withStringArray(
    index: Int,
    block: (List<String?>) -> T,
): T? {
    val value = if (index in indices) (get(index) as? List<*>)?.map { item -> item as? String } else null
    return if (value != null) block(value) else null
}

fun List<Any?>.getStringArray(index: Int): List<String?>? = 
    if (index in indices) (get(index) as? List<*>)?.map { it as? String } else null

inline fun <T, R> List<Any?>.mapValue(
    index: Int,
    transform: (Any?) -> R?,
): R? = if (index in indices) transform(get(index)) else null

inline fun <reified T> List<Any?>.getTyped(index: Int): T? = 
    if (index in indices) get(index) as? T else null