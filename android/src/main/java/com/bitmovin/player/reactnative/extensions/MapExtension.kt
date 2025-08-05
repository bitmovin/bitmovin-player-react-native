package com.bitmovin.player.reactnative.extensions

fun Map<String, Any?>.getBooleanOrNull(key: String): Boolean? = get(key) as? Boolean
fun Map<String, Any?>.getIntOrNull(key: String): Int? = (get(key) as? Number)?.toInt()
fun Map<String, Any?>.getInt(key: String): Int = (get(key) as? Number)?.toInt() ?: 0
fun Map<String, Any?>.getDoubleOrNull(key: String): Double? = (get(key) as? Number)?.toDouble()
fun Map<String, Any?>.getString(key: String): String? = get(key) as? String
fun Map<String, Any?>.getMap(key: String): Map<String, Any?>? = get(key) as? Map<String, Any?>
fun Map<String, Any?>.getArray(key: String): List<Any?>? = get(key) as? List<Any?>

inline fun <T> Map<String, Any?>.withDouble(
    key: String,
    block: (Double) -> T,
): T? {
    val value = (get(key) as? Number)?.toDouble()
    return if (value != null) block(value) else null
}

inline fun <T> Map<String, Any?>.withMap(
    key: String,
    block: (Map<String, Any?>) -> T,
): T? {
    val value = get(key) as? Map<String, Any?>
    return if (value != null) block(value) else null
}

inline fun <T> Map<String, Any?>.withInt(
    key: String,
    block: (Int) -> T,
): T? {
    val value = (get(key) as? Number)?.toInt()
    return if (value != null) block(value) else null
}

inline fun <T> Map<String, Any?>.withBoolean(
    key: String,
    block: (Boolean) -> T,
): T? {
    val value = get(key) as? Boolean
    return if (value != null) block(value) else null
}

inline fun <T> Map<String, Any?>.withString(
    key: String,
    block: (String) -> T,
): T? {
    val value = get(key) as? String
    return if (value != null) block(value) else null
}

inline fun <T> Map<String, Any?>.withArray(
    key: String,
    block: (List<Any?>) -> T,
): T? {
    val value = get(key) as? List<Any?>
    return if (value != null) block(value) else null
}

inline fun <T> Map<String, Any?>.withStringArray(
    key: String,
    block: (List<String?>) -> T,
): T? {
    val value = (get(key) as? List<*>)?.map { item -> item as? String }
    return if (value != null) block(value) else null
}

fun Map<String, Any?>.getStringArray(key: String): List<String?>? = (get(key) as? List<*>)?.map { it as? String }

inline fun <T, R> Map<String, Any?>.mapValue(
    key: String,
    transform: (Any?) -> R?,
): R? = if (containsKey(key)) transform(get(key)) else null

inline fun <reified T> Map<String, Any?>.toMap(): Map<String, T> = mapValues { it.value as T }

/** Convert a [Map] to [Map], adding each [T] value using [put]. */
private inline fun <T> Map<String, T>.toMap(
    put: MutableMap<String, Any?>.(String, T) -> Unit = { key, value -> this[key] = value },
): Map<String, Any?> = mutableMapOf<String, Any?>().apply {
    forEach { put(it.key, it.value) }
}

@JvmName("toStringMap")
fun Map<String, String>.toMap(): Map<String, Any?> = toMap()

fun List<Any?>.toMapList(): List<Map<String, Any?>?> = map { it as? Map<String, Any?> }

fun List<Any?>.toStringList(): List<String?> = map { it as? String }
fun List<Any?>.toBooleanList(): List<Boolean?> = map { it as? Boolean }
fun List<Any?>.toDoubleList(): List<Double?> = map { (it as? Number)?.toDouble() }
fun List<Any?>.toIntList(): List<Int?> = map { (it as? Number)?.toInt() }

inline fun <T> List<T>.mapToList(
    transform: (T) -> Map<String, Any?>,
): List<Map<String, Any?>> = map(transform)
