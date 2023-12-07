package com.bitmovin.player.reactnative

import android.util.Log
import com.bitmovin.player.reactnative.extensions.uiManagerModule
import com.facebook.react.bridge.*
import com.facebook.react.uimanager.UIManagerModule

private const val MODULE_NAME = "BitmovinBaseModule"

/**
 * Base for Bitmovin React modules.
 *
 * Provides many helper methods that are promise exception safe.
 *
 * In general, code should not throw while resolving a [Promise]. Instead, [Promise.reject] should be used.
 * This doesn't match Kotlin's error style, which uses exception. The helper methods in this class, provide such
 * convenience, they can only be called in a context that will catch any Exception and reject the [Promise].
 *
 */
abstract class BitmovinBaseModule(
    protected val context: ReactApplicationContext,
) : ReactContextBaseJavaModule(context) {
    /**
     * Runs [block] on the UI thread with [UIManagerModule.addUIBlock] and [TPromise.resolve] [this] with
     * its return value. If [block] throws, [Promise.reject] [this] with the [Throwable].
     */
    protected inline fun <T, R : T> TPromise<T>.resolveOnUiThread(crossinline block: () -> R) {
        val uiManager = runAndRejectOnException { context.uiManagerModule } ?: return
        uiManager.addUIBlock {
            resolveOnCurrentThread { block() }
        }
    }
}

/** Compile time wrapper for Promises to type check the resolved type [T]. */
@JvmInline
value class TPromise<T>(val promise: Promise) {
    /**
     * Resolve the promise with [value], see [Promise.resolve].
     *
     * Prefer [resolveOnCurrentThread] to automatically reject promise if an Exception is thrown.
     */
    // Promise only support built-in types. Functions that return [Unit] must resolve to `null`.
    fun resolve(value: T): Unit = promise.resolve(value.takeUnless { it is Unit })

    /**
     * Reject the promise due to [throwable], see [Promise.reject].
     * Prefer [resolveOnCurrentThread] or [runAndRejectOnException] instead for automatic catching.
     */
    fun reject(throwable: Throwable) {
        Log.e(MODULE_NAME, "Failed to execute Bitmovin method", throwable)
        promise.reject(throwable)
    }

    /**
     * [TPromise.resolve] with [block] return value.
     * If [block] throws, [Promise.reject] with the [Throwable].
     */
    inline fun resolveOnCurrentThread(
        crossinline block: () -> T,
    ): Unit = runAndRejectOnException { resolve(block()) } ?: Unit

    /** Run [block], returning it's return value. If [block] throws, [Promise.reject] and return null. */
    inline fun <R> runAndRejectOnException(block: () -> R): R? = try {
        block()
    } catch (e: Exception) {
        reject(e)
        null
    }
}

inline val Promise.int get() = TPromise<Int>(this)
inline val Promise.unit get() = TPromise<Unit>(this)
inline val Promise.string get() = TPromise<String>(this)
inline val Promise.double get() = TPromise<Double>(this)
inline val Promise.float get() = TPromise<Float>(this)
inline val Promise.bool get() = TPromise<Boolean>(this)
inline val Promise.map get() = TPromise<ReadableMap>(this)
inline val Promise.array get() = TPromise<ReadableArray>(this)
inline val <T> TPromise<T>.nullable get() = TPromise<T?>(promise)
