package com.bitmovin.player.reactnative

import expo.modules.kotlin.AppContext
import expo.modules.kotlin.jni.JavaScriptFunction
import expo.modules.kotlin.jni.JavaScriptValue
import expo.modules.kotlin.sharedobjects.SharedObject
import java.util.concurrent.CompletableFuture
import java.util.concurrent.TimeUnit
import java.util.concurrent.locks.ReentrantLock
import kotlin.concurrent.withLock

/**
 * Routes one native owner's SDK callbacks to its JavaScript dispatcher.
 *
 * The JS facade retains its dispatcher; the function stored here forwards through a weak JS reference.
 * [call] schedules a synchronous decision on the JS runtime and waits on the SDK thread for at most 250 ms.
 * [notify] schedules a notification without waiting. [future] supplies a per-call completion object for an
 * asynchronous reply, so HTTP preprocessing can finish later without blocking the JS thread.
 *
 * The native owner calls [close] before SDK destruction. This wakes synchronous waiters and completes pending
 * futures with their fallbacks, even when the JS callback never settles. There are no request-ID lookups.
 *
 * For example, a fullscreen handler forwards its SDK request and uses the returned state:
 * ```kotlin
 * val callbacks = CallbackScope(appContext, callback)
 * val active = callbacks.call("enterFullscreen", emptyList()) as? Boolean
 * if (active != null) isFullscreen = active
 * // When the owning SharedObject is released:
 * callbacks.close()
 * ```
 * Callers choose the SDK fallback when [call] returns null. Callback tokens come from the JS configuration
 * serializer; named UI operations such as `enterFullscreen` use the same transport.
 */
class CallbackScope(private val context: AppContext, callback: JavaScriptFunction<JavaScriptValue>?) {
    private val timeoutMs = 250L
    private val lock = ReentrantLock()
    private val changed = lock.newCondition()
    private var callback: JavaScriptFunction<JavaScriptValue>? = callback
    private val pending = mutableSetOf<SharedCallbackResult>()

    /** Disables future dispatches, wakes blocked SDK threads and cancels pending replies outside the lock. */
    fun close() {
        val cancelled = lock.withLock {
            callback = null
            changed.signalAll()
            pending.toList().also { pending.clear() }
        }
        // SDK completions may reenter the scope, so never invoke them under its lock.
        cancelled.forEach { it.resolve(null) }
    }

    /** Posts a notification to JS. There is no return value or synchronous SDK wait. */
    fun notify(operation: String, args: List<Any?>) = schedule(operation, args)

    /**
     * Waits up to 250 ms on the calling SDK thread, releasing the lock while JS runs.
     * Returns null on timeout, a closed owner or a failed JS call; the SDK converter supplies its fallback.
     * A mutating call merges JS settings changes into its first argument before returning them.
     */
    fun call(operation: String, args: List<Any?>, mutating: Boolean = false): Any? {
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

    /**
     * Returns a future completed by one JS reply, or [fallback] when this owner closes or the converter throws.
     * The scope retains the completion object until it resolves; late or duplicate replies cannot replace it.
     * [fallbackArgument] identifies the original request/response argument for the JS dispatcher's own fallback.
     */
    fun <T> future(
        operation: String,
        args: List<Any?>,
        fallback: T,
        fallbackArgument: Int? = null,
        convert: (Any) -> T,
    ): CompletableFuture<T> {
        val future = CompletableFuture<T>()
        lateinit var result: SharedCallbackResult
        result = SharedCallbackResult(context) { value ->
            val response = lock.withLock {
                pending.remove(result)
                if (callback == null) null else value
            }
            try {
                future.complete(if (response == null) fallback else convert(response))
            } catch (error: Exception) {
                future.complete(fallback)
                throw error
            }
        }
        val active = lock.withLock {
            if (callback == null) false else pending.add(result)
        }
        if (active) {
            schedule(operation, args, result, fallbackArgument = fallbackArgument)
        } else {
            result.resolve(null)
        }
        return future
    }

    /** Releases the callback forwarder if native peer construction fails, then rethrows that failure. */
    internal fun <T : SharedObject> createSharedObject(factory: () -> T): T =
        runCatching(factory).onFailure { close() }.getOrThrow()

    /** Posts to the runtime and reads the current forwarder there, handling unavailable runtimes and JS errors. */
    private fun schedule(
        operation: String,
        args: List<Any?>,
        result: SharedCallbackResult? = null,
        mutating: Boolean = false,
        fallbackArgument: Int? = null,
        completion: ((Any?) -> Unit)? = null,
    ) {
        try {
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
        } catch (_: Throwable) {
            result?.resolve(null)
            completion?.invoke(null)
        }
    }
}

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
