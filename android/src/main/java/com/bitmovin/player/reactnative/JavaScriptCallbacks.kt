package com.bitmovin.player.reactnative

import expo.modules.kotlin.AppContext
import expo.modules.kotlin.jni.JavaScriptObject
import expo.modules.kotlin.jni.JavaScriptValue
import expo.modules.kotlin.jni.JavaScriptWeakObject
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.objects.Object
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Job
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.async
import kotlinx.coroutines.cancel
import kotlinx.coroutines.isActive
import kotlinx.coroutines.launch
import kotlinx.coroutines.runBlocking
import kotlinx.coroutines.suspendCancellableCoroutine
import kotlinx.coroutines.withTimeoutOrNull
import java.util.concurrent.atomic.AtomicReference
import kotlin.coroutines.resume
import kotlin.coroutines.resumeWithException

/** Per-owner JS scheduling and coroutine cancellation. Configuration contains actual functions, never tokens. */
internal class JavaScriptCallbacks(private val context: AppContext, private val module: Module) {
    val scope = CoroutineScope(
        context.backgroundCoroutineScope.coroutineContext +
            SupervisorJob(context.backgroundCoroutineScope.coroutineContext[Job]),
    )

    // The bridge only adapts SDK argument/return conventions; it performs no function lookup or dispatch.
    private val bridge = context.runtime.eval(
        """(function(args, mutating, undefinedIndex, awaitPromise) {
          if (undefinedIndex != null && args[undefinedIndex] == null) args[undefinedIndex] = undefined;
          const value = this.callback.apply(this.receiver, args);
          if (!awaitPromise && value && typeof value.then === 'function') {
            Promise.resolve(value).catch(() => {});
            return null;
          }
          return mutating ? { ...args[0], ...(value && typeof value === 'object' ? value : {}) } : value;
        })""",
    ).getFunction<JavaScriptValue>()

    /** Snapshot ordinary SDK values on JS before the SDK's lazy factory runs on main. */
    fun snapshot(config: JavaScriptObject?, captureAdvertising: Boolean = false): Map<String, Any?>? {
        val root = config ?: return null
        val weakRoot = root.createWeak()
        fun read(value: JavaScriptValue, path: List<String>): Any? = when {
            value.isNull() || value.isUndefined() -> null
            value.isBool() -> value.getBool()
            value.isNumber() -> value.getDouble()
            value.isString() -> value.getString()
            value.isFunction() -> JavaScriptCallback(
                this,
                weakRoot,
                path,
                if (captureAdvertising && path.firstOrNull() == "advertisingConfig") {
                    value.getObject().createWeak()
                } else {
                    null
                },
            )
            value.isArray() -> value.getArray().mapIndexed { index, item -> read(item, path + index.toString()) }
            value.isObject() -> value.getObject().let { owner ->
                owner.getPropertyNames().mapNotNull { key ->
                    val property = owner.getProperty(key)
                    if (property.isUndefined()) null else key to read(property, path + key)
                }.toMap()
            }
            else -> null
        }
        return root.getPropertyNames().mapNotNull { key ->
            val value = root.getProperty(key)
            if (value.isUndefined()) null else key to read(value, listOf(key))
        }.toMap()
    }

    fun close() = scope.cancel()

    fun blockingCall(
        callback: JavaScriptCallback,
        args: List<Any?>,
        mutating: Boolean,
        undefinedIndex: Int?,
    ): Any? {
        if (context.reactContext?.isOnJSQueueThread == true) {
            if (!scope.isActive) return null
            val holder = callback.holder(context) ?: return null
            return bridge(args, mutating, undefinedIndex, false, thisValue = holder, appContext = context)
                .toCallbackValue()
        }
        return runBlocking {
            withTimeoutOrNull(250) { call(callback, args, mutating, undefinedIndex, false) }
        }
    }

    suspend fun call(
        callback: JavaScriptCallback,
        args: List<Any?>,
        mutating: Boolean,
        undefinedIndex: Int?,
        awaitPromise: Boolean,
    ): Any? {
        val operation = scope.async {
            suspendCancellableCoroutine<Any?> { continuation ->
                val waiting = AtomicReference(continuation)
                continuation.invokeOnCancellation { waiting.set(null) }
                try {
                    context.runtime.schedule {
                        if (waiting.get() == null) return@schedule
                        try {
                            val holder = callback.holder(context) ?: run {
                                waiting.getAndSet(null)?.resume(null)
                                return@schedule
                            }
                            val reply = bridge(
                                args,
                                mutating,
                                undefinedIndex,
                                awaitPromise,
                                thisValue = holder,
                                appContext = context,
                            )
                            if (awaitPromise && reply.isObject() &&
                                reply.getObject().getProperty("then").isFunction()
                            ) {
                                val handlers = module.Object {
                                    Function("resolve") { result: JavaScriptValue ->
                                        waiting.getAndSet(null)?.resumeWith(runCatching { result.toCallbackValue() })
                                    }
                                    Function("reject") { reason: String ->
                                        waiting.getAndSet(null)?.resumeWithException(IllegalStateException(reason))
                                    }
                                }
                                context.runtime.eval(
                                    "(function(sink) { this.then(sink.resolve, error => " +
                                        "sink.reject(String(error?.stack ?? error))); })",
                                ).getFunction<JavaScriptValue>()(
                                    handlers,
                                    thisValue = reply.getObject(),
                                    appContext = context,
                                )
                            } else {
                                val value = reply.toCallbackValue()
                                waiting.getAndSet(null)?.resume(value)
                            }
                        } catch (error: Throwable) {
                            waiting.getAndSet(null)?.resumeWithException(error)
                        }
                    }
                } catch (error: Throwable) {
                    waiting.getAndSet(null)?.resumeWithException(error)
                }
            }
        }
        return try { operation.await() } finally { operation.cancel() }
    }
}

/** A weak original config root and real SDK property path preserve both callback and parent replacement. */
internal class JavaScriptCallback(
    private val callbacks: JavaScriptCallbacks,
    private val root: JavaScriptWeakObject,
    private val path: List<String>,
    private val captured: JavaScriptWeakObject?,
) {
    val scope get() = callbacks.scope

    fun blockingCall(args: List<Any?>, mutating: Boolean = false, undefinedIndex: Int? = null): Any? = runCatching {
        callbacks.blockingCall(this, args, mutating, undefinedIndex)
    }.getOrNull()

    suspend fun asyncCall(args: List<Any?>): Any? = callbacks.call(this, args, false, null, true)

    fun emit(args: List<Any?>, undefinedIndex: Int? = null) {
        scope.launch { runCatching { callbacks.call(this@JavaScriptCallback, args, false, undefinedIndex, true) } }
    }

    // Read only on the JS runtime thread. Captured advertising callbacks intentionally remain unbound.
    fun holder(context: AppContext): JavaScriptObject? {
        val holder = context.runtime.jsiContext.createObject()
        if (captured != null) {
            val function: JavaScriptObject? = captured.lock()
            holder.setProperty("callback", function ?: return null)
        } else {
            val original: JavaScriptObject? = root.lock()
            var owner = original ?: return null
            for (key in path.dropLast(1)) {
                val value = owner.getProperty(key)
                if (!value.isObject()) return null
                owner = value.getObject()
            }
            val function = owner.getProperty(path.last())
            if (!function.isFunction()) return null
            holder.setProperty("callback", function)
            holder.setProperty("receiver", owner)
        }
        return holder
    }
}

/** Native DTO decoding stays on JS; SDK main-thread code only consumes the resulting ordinary values. */
internal fun JavaScriptValue.toCallbackValue(): Any? = when {
    isNull() || isUndefined() -> null
    isBool() -> getBool()
    isNumber() -> getDouble()
    isString() -> getString()
    isArray() -> getArray().map { it.toCallbackValue() }
    isObject() -> getObject().let { owner ->
        owner.getPropertyNames().associateWith { owner.getProperty(it).toCallbackValue() }
    }
    else -> null
}
