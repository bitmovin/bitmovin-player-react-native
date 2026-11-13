package com.bitmovin.player.reactnative

import expo.modules.kotlin.AppContext
import expo.modules.kotlin.defaultmodules.NativeModulesProxyModule
import expo.modules.kotlin.jni.JavaScriptObject
import expo.modules.kotlin.jni.JavaScriptValue
import expo.modules.kotlin.jni.JavaScriptWeakObject
import expo.modules.kotlin.objects.Object
import expo.modules.kotlin.types.obtainTypeConverter
import kotlinx.coroutines.CancellationException
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
    fun call(): T? {
        val value = invokeOnJs(appContext, arguments) ?: return null
        return convert(value)
    }
    return if (appContext.runtime.reactContext?.isOnJSQueueThread == true) {
        call()
    } else {
        runBlocking {
            withTimeoutOrNull(timeout) {
                suspendCancellableCoroutine<T?> { continuation ->
                    try {
                        appContext.runtime.schedule {
                            if (continuation.isActive) {
                                try {
                                    continuation.resume(call())
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

/** Maps Expo's detached JS types, including Double for numbers, without implicit numeric coercion. */
@JvmName("callBlockingTyped")
internal inline fun <reified Input : Any, Output> JavaScriptWeakObject.callBlocking(
    appContext: AppContext,
    vararg arguments: Any?,
    timeout: Duration = 250.milliseconds,
    crossinline convert: (Input) -> Output,
): Output? = callBlocking<Output?>(appContext, *arguments, timeout = timeout) { value ->
    obtainTypeConverter<Input>().convert(value.toNativeValue(), appContext, forceConversion = true)?.let { convert(it) }
}

/** Awaits only the returned value/Promise; cancellation drops the per-call continuation and late replies. */
internal suspend fun <T> JavaScriptWeakObject.callSuspending(
    appContext: AppContext,
    vararg arguments: Any?,
    convert: (JavaScriptValue) -> T,
): T? = suspendCancellableCoroutine { continuation ->
    val waiting = AtomicReference(continuation)
    continuation.invokeOnCancellation { waiting.set(null) }
    fun complete(value: T? = null, error: Exception? = null) {
        val pending = waiting.getAndSet(null) ?: return
        if (error is CancellationException) pending.cancel(error) else pending.resume(value)
    }
    try {
        appContext.runtime.schedule {
            if (waiting.get() == null) return@schedule
            try {
                val function: JavaScriptObject? = lock()
                if (function == null) return@schedule complete()
                // Expo installs this framework module for every AppContext. Its Object factory creates
                // anonymous completion functions without another module or global callback table.
                val factory = checkNotNull(appContext.registry.getModule<NativeModulesProxyModule>())
                val handlers = factory.Object {
                    Function("resolve") { value: JavaScriptValue ->
                        if (waiting.get() != null) {
                            try {
                                complete(convert(value))
                            } catch (error: Exception) {
                                complete(error = error)
                            }
                        }
                    }
                    Function("reject") { _: JavaScriptValue -> complete() }
                }
                appContext.runtime.eval(
                    "(function(args, sink) { Promise.resolve(this(...args)).then(sink.resolve, sink.reject); })",
                ).getFunction<Unit?>()(arguments.toList(), handlers, thisValue = function, appContext = appContext)
            } catch (error: Exception) {
                complete(error = error)
            }
        }
    } catch (error: Exception) {
        complete(error = error)
    }
}

/** Maps fulfilled or immediate detached values through Expo; numbers remain Double, without numeric coercion. */
@JvmName("callSuspendingTyped")
internal suspend inline fun <reified Input : Any, Output> JavaScriptWeakObject.callSuspending(
    appContext: AppContext,
    vararg arguments: Any?,
    crossinline convert: (Input) -> Output,
): Output? = callSuspending<Output?>(appContext, *arguments) { value ->
    obtainTypeConverter<Input>().convert(value.toNativeValue(), appContext, forceConversion = true)?.let { convert(it) }
}

/** Recover a callable wrapper transiently: Expo exposes getFunction on values, not on weak object locks. */
private fun JavaScriptWeakObject.invokeOnJs(appContext: AppContext, arguments: Array<out Any?>): JavaScriptValue? {
    val function: JavaScriptObject? = lock()
    val holder = appContext.runtime.jsiContext.createObject()
    holder.setProperty("callback", function ?: return null)
    return holder.getProperty("callback").getFunction<JavaScriptValue>()(*arguments, appContext = appContext)
}
