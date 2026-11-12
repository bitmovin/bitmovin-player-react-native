package com.bitmovin.player.reactnative

import expo.modules.kotlin.AppContext
import expo.modules.kotlin.defaultmodules.NativeModulesProxyModule
import expo.modules.kotlin.jni.JavaScriptObject
import expo.modules.kotlin.jni.JavaScriptValue
import expo.modules.kotlin.jni.JavaScriptWeakObject
import expo.modules.kotlin.objects.Object
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.runBlocking
import kotlinx.coroutines.suspendCancellableCoroutine
import kotlinx.coroutines.withTimeoutOrNull
import java.util.concurrent.atomic.AtomicReference
import kotlin.coroutines.resume

/** Calls an immediate SDK callback on JS, bounding cross-thread waiting without blocking the JS thread. */
internal fun <T> JavaScriptWeakObject.callBlocking(
    appContext: AppContext,
    vararg arguments: Any?,
    convert: (JavaScriptValue) -> T,
): T? {
    fun call(): T? {
        val value = invokeOnJs(appContext, arguments) ?: return null
        return convert(value)
    }
    return runCatching {
        if (appContext.runtime.reactContext?.isOnJSQueueThread == true) {
            call()
        } else {
            runBlocking {
                withTimeoutOrNull(250) {
                    suspendCancellableCoroutine<T?> { continuation ->
                        try {
                            appContext.runtime.schedule {
                                if (continuation.isActive) continuation.resume(runCatching { call() }.getOrNull())
                            }
                        } catch (_: Exception) {
                            continuation.resume(null)
                        }
                    }
                }
            }
        }
    }.getOrNull()
}

/** Awaits only the returned value/Promise; cancellation drops the per-call continuation and late replies. */
internal suspend fun <T> JavaScriptWeakObject.callSuspending(
    appContext: AppContext,
    vararg arguments: Any?,
    convert: (JavaScriptValue) -> T,
): T? = suspendCancellableCoroutine { continuation ->
    val waiting = AtomicReference(continuation)
    continuation.invokeOnCancellation { waiting.set(null) }
    fun fail(error: Exception) {
        val pending = waiting.getAndSet(null) ?: return
        if (error is CancellationException) pending.cancel(error) else pending.resume(null)
    }
    fun resolve(value: JavaScriptValue) {
        if (waiting.get() == null) return
        try {
            val result = convert(value)
            waiting.getAndSet(null)?.resume(result)
        } catch (error: Exception) {
            fail(error)
        }
    }
    try {
        appContext.runtime.schedule {
            if (waiting.get() == null) return@schedule
            try {
                val reply = invokeOnJs(appContext, arguments)
                if (reply == null) {
                    waiting.getAndSet(null)?.resume(null)
                } else if (reply.isObject() && reply.getObject().getProperty("then").isFunction()) {
                    // Expo installs this framework module for every AppContext. Its public Object factory
                    // creates anonymous host functions without another registered module or callback table.
                    val factory = checkNotNull(appContext.registry.getModule<NativeModulesProxyModule>())
                    val handlers = factory.Object {
                        Function("resolve") { value: JavaScriptValue -> resolve(value) }
                        Function("reject") { _: JavaScriptValue -> waiting.getAndSet(null)?.resume(null) }
                    }
                    appContext.runtime.eval("(function(sink) { this.then(sink.resolve, sink.reject); })")
                        .getFunction<Unit>()(handlers, thisValue = reply.getObject(), appContext = appContext)
                } else {
                    resolve(reply)
                }
            } catch (error: Exception) {
                fail(error)
            }
        }
    } catch (error: Exception) {
        fail(error)
    }
}

/** Recover a callable wrapper transiently: Expo exposes getFunction on values, not on weak object locks. */
private fun JavaScriptWeakObject.invokeOnJs(appContext: AppContext, arguments: Array<out Any?>): JavaScriptValue? {
    val function: JavaScriptObject? = lock()
    val holder = appContext.runtime.jsiContext.createObject()
    holder.setProperty("callback", function ?: return null)
    return holder.getProperty("callback").getFunction<JavaScriptValue>()(*arguments, appContext = appContext)
}
