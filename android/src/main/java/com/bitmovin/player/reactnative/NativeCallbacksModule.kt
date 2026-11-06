package com.bitmovin.player.reactnative

import expo.modules.kotlin.AppContext
import expo.modules.kotlin.jni.JavaScriptFunction
import expo.modules.kotlin.jni.JavaScriptValue
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import expo.modules.kotlin.sharedobjects.SharedObject
import java.util.concurrent.CompletableFuture
import java.util.concurrent.TimeUnit
import java.util.concurrent.atomic.AtomicBoolean
import java.util.concurrent.locks.ReentrantLock
import kotlin.concurrent.withLock

/** A completion belongs to one invocation; no identity or lookup table crosses the bridge. */
class CallbackResult(appContext: AppContext, private val complete: (Any?) -> Unit = {}) : SharedObject(appContext) {
    private val completed = AtomicBoolean(false)
    fun resolve(value: Any?) {
        if (completed.compareAndSet(false, true)) complete(value)
    }
    fun expire() { completed.set(true) }
    override fun sharedObjectDidRelease() = resolve(null)
}

class NativeCallbacksModule : Module() {
    override fun definition() = ModuleDefinition {
        Name("NativeCallbacksModule")
        Class(CallbackResult::class) {
            Constructor { CallbackResult(appContext) }
            Function("resolve") { result: CallbackResult, value: JavaScriptValue ->
                result.resolve(runCatching { value.toCallbackValue() }.getOrNull())
            }
        }
    }
}

/** Expo's generic Any converter does not accept null inside nested objects. */
private fun JavaScriptValue.toCallbackValue(): Any? = when {
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
class CallbackScope(private val context: AppContext, callback: JavaScriptFunction<Any?>?) {
    private val lock = ReentrantLock()
    private val changed = lock.newCondition()
    private var closed = false
    private var callback: JavaScriptFunction<Any?>? = callback

    fun close() = lock.withLock {
        closed = true
        callback = null
        changed.signalAll()
    }

    private fun schedule(operation: String, args: List<Any?>, result: CallbackResult?) {
        context.runtime.schedule {
            val function = lock.withLock { if (closed) null else callback }
            try {
                if (function?.isValid() == true) {
                    function(operation, args, result, appContext = context)
                } else {
                    result?.resolve(null)
                }
            } catch (_: Throwable) {
                result?.resolve(null)
            }
        }
    }

    fun notify(operation: String, args: List<Any?>) = schedule(operation, args, null)

    fun call(operation: String, args: List<Any?>, timeoutMs: Long): Any? {
        var completed = false
        var value: Any? = null
        val result = CallbackResult(context) { response ->
            lock.withLock {
                value = response
                completed = true
                changed.signalAll()
            }
        }
        schedule(operation, args, result)
        lock.withLock {
            var remaining = TimeUnit.MILLISECONDS.toNanos(timeoutMs)
            while (!completed && !closed && remaining > 0) remaining = changed.awaitNanos(remaining)
            result.expire()
            return value
        }
    }

    fun <T> future(operation: String, args: List<Any?>, fallback: T, convert: (Any) -> T): CompletableFuture<T> {
        val future = CompletableFuture<T>()
        val result = CallbackResult(context) { value ->
            try {
                future.complete(if (value == null) fallback else convert(value))
            } catch (_: Exception) {
                future.complete(fallback)
            }
        }
        schedule(operation, args, result)
        return future
    }
}
