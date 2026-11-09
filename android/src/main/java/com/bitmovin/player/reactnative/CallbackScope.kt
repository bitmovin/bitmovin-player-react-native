package com.bitmovin.player.reactnative

import expo.modules.kotlin.AppContext
import expo.modules.kotlin.jni.JavaScriptFunction
import expo.modules.kotlin.jni.JavaScriptValue
import expo.modules.kotlin.sharedobjects.SharedObject
import java.util.concurrent.CompletableFuture
import java.util.concurrent.TimeUnit
import java.util.concurrent.locks.ReentrantLock
import kotlin.concurrent.withLock

/** Expo's generic Any converter does not accept null inside nested objects. */
internal fun JavaScriptValue.toCallbackValue(): Any? = when {
    isNull() || isUndefined() -> null
    isBool() -> getBool()
    isNumber() -> getDouble()
    isString() -> getString()
    isArray() -> getArray().map { it.toCallbackValue() }
    isObject() -> getObject().let { value ->
        value.getPropertyNames().associateWith { value.getProperty(it).toCallbackValue() }
    }
    else -> null
}

/** Owns callback lifetime and wakes synchronous SDK calls when their owner is destroyed. */
class CallbackScope(private val context: AppContext, callback: JavaScriptFunction<JavaScriptValue>?) {
    private val lock = ReentrantLock()
    private val changed = lock.newCondition()
    private var callback: JavaScriptFunction<JavaScriptValue>? = callback

    fun close() = lock.withLock {
        callback = null
        changed.signalAll()
    }

    internal fun <T : SharedObject> createSharedObject(factory: () -> T): T =
        runCatching(factory).onFailure { close() }.getOrThrow()

    private fun schedule(
        operation: String,
        args: List<Any?>,
        result: CallbackResult? = null,
        mutating: Boolean = false,
        fallbackArgument: Int? = null,
        completion: ((Any?) -> Unit)? = null,
    ) {
        context.runtime.schedule {
            val function = lock.withLock { callback }
            try {
                if (function?.isValid() == true) {
                    val value = function(operation, args, result, mutating, fallbackArgument, appContext = context)
                    completion?.invoke(value.toCallbackValue())
                } else {
                    result?.resolve(null)
                    completion?.invoke(null)
                }
            } catch (_: Throwable) {
                result?.resolve(null)
                completion?.invoke(null)
            }
        }
    }

    fun notify(operation: String, args: List<Any?>) = schedule(operation, args)

    fun call(operation: String, args: List<Any?>, timeoutMs: Long, mutating: Boolean = false): Any? {
        var completed = false
        var value: Any? = null
        schedule(operation, args, mutating = mutating) { response ->
            lock.withLock {
                value = response
                completed = true
                changed.signalAll()
            }
        }
        lock.withLock {
            var remaining = TimeUnit.MILLISECONDS.toNanos(timeoutMs)
            while (!completed && callback != null && remaining > 0) remaining = changed.awaitNanos(remaining)
            return if (callback == null) null else value
        }
    }

    fun <T> future(
        operation: String,
        args: List<Any?>,
        fallback: T,
        fallbackArgument: Int? = null,
        convert: (Any) -> T,
    ): CompletableFuture<T> {
        val future = CompletableFuture<T>()
        val result = CallbackResult(context) { value ->
            try {
                future.complete(if (value == null) fallback else convert(value))
            } catch (error: Exception) {
                future.complete(fallback)
                throw error
            }
        }
        schedule(operation, args, result, fallbackArgument = fallbackArgument)
        return future
    }
}
