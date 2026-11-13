package com.bitmovin.player.reactnative

import expo.modules.kotlin.AppContext
import expo.modules.kotlin.defaultmodules.NativeModulesProxyModule
import expo.modules.kotlin.jni.JavaScriptObject
import expo.modules.kotlin.jni.JavaScriptValue
import expo.modules.kotlin.jni.JavaScriptWeakObject
import expo.modules.kotlin.objects.Object
import kotlinx.coroutines.CancellableContinuation
import kotlinx.coroutines.runBlocking
import kotlinx.coroutines.suspendCancellableCoroutine
import kotlinx.coroutines.withTimeoutOrNull
import java.util.concurrent.atomic.AtomicReference
import kotlin.coroutines.resume
import kotlin.coroutines.resumeWithException
import kotlin.time.Duration
import kotlin.time.Duration.Companion.milliseconds

/** Calls an immediate SDK callback on JS, bounding cross-thread waiting without blocking the JS thread. */
internal fun <T> JavaScriptWeakObject.callBlocking(
    appContext: AppContext,
    vararg arguments: Any?,
    timeout: Duration = 250.milliseconds,
    convert: (JavaScriptValue) -> T,
): T? {
    return if (appContext.runtime.reactContext?.isOnJSQueueThread == true) {
        callOnJs(appContext, arguments, convert)
    } else {
        runBlocking {
            withTimeoutOrNull(timeout) {
                suspendCancellableCoroutine<T?> { continuation ->
                    try {
                        appContext.runtime.schedule {
                            if (continuation.isActive) {
                                try {
                                    continuation.resume(callOnJs(appContext, arguments, convert))
                                } catch (error: Exception) {
                                    continuation.resumeWithException(error)
                                }
                            }
                        }
                    } catch (error: Exception) {
                        continuation.resumeWithException(error)
                    }
                }
            }
        }
    }
}

/** Awaits only the returned value/Promise; owner cancellation ignores late replies. */
internal suspend fun <T> JavaScriptWeakObject.callSuspending(
    appContext: AppContext,
    vararg arguments: Any?,
    convert: (JavaScriptValue) -> T,
): T? = suspendCancellableCoroutine { continuation ->
    // Clear the delegate on cancellation so an unresolved JS Promise cannot retain its coroutine frame.
    val waiting = AtomicReference<CancellableContinuation<T?>?>(continuation)
    continuation.invokeOnCancellation { waiting.set(null) }
    appContext.runtime.schedule {
        if (waiting.get()?.isActive == true) {
            try {
                invokeAndAwaitOnJs(appContext, arguments, waiting, convert)
            } catch (error: Exception) {
                waiting.getAndSet(null)?.resumeWithException(error)
            }
        }
    }
}

private fun <T> JavaScriptWeakObject.invokeAndAwaitOnJs(
    appContext: AppContext,
    arguments: Array<out Any?>,
    waiting: AtomicReference<CancellableContinuation<T?>?>,
    convert: (JavaScriptValue) -> T,
) {
    val function: JavaScriptObject? = lock()
    if (function == null) throw InvalidRnArgumentException("Configured JavaScript callback is no longer available")
    // Expo installs this framework module for every AppContext. Its Object factory creates
    // anonymous completion functions without another module or global callback table.
    val factory = checkNotNull(appContext.registry.getModule<NativeModulesProxyModule>())
    val handlers = factory.Object {
        Function("resolve") { value: JavaScriptValue ->
            val pending = waiting.getAndSet(null)
            if (pending?.isActive == true) pending.resumeWith(runCatching { convert(value) })
        }
        Function("reject") { reason: JavaScriptValue ->
            val pending = waiting.getAndSet(null)
            if (pending?.isActive == true) {
                pending.resumeWith(
                    runCatching {
                        val message = if (reason.isString()) reason.getString() else "JavaScript callback rejected"
                        throw IllegalStateException(message)
                    },
                )
            }
        }
    }
    appContext.runtime.eval(
        "(function(args, sink) { Promise.resolve(this(...args)).then(sink.resolve, sink.reject); })",
    ).getFunction<Unit?>()(arguments.toList(), handlers, thisValue = function, appContext = appContext)
}

/** Recover a callable wrapper transiently: Expo exposes getFunction on values, not on weak object locks. */
private fun <T> JavaScriptWeakObject.callOnJs(
    appContext: AppContext,
    arguments: Array<out Any?>,
    convert: (JavaScriptValue) -> T,
): T? {
    val function: JavaScriptObject? = lock()
    val holder = appContext.runtime.jsiContext.createObject()
    holder.setProperty(
        "callback",
        function ?: throw InvalidRnArgumentException("Configured JavaScript callback is no longer available"),
    )
    return convert(holder.getProperty("callback").getFunction<JavaScriptValue>()(*arguments, appContext = appContext))
}
