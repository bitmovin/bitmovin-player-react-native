package com.bitmovin.player.reactnative

import android.util.Log
import com.bitmovin.player.api.Player
import com.bitmovin.player.api.source.Source
import com.bitmovin.player.reactnative.extensions.drmModule
import com.bitmovin.player.reactnative.extensions.offlineModule
import com.bitmovin.player.reactnative.extensions.playerModule
import com.bitmovin.player.reactnative.extensions.sourceModule
import com.bitmovin.player.reactnative.extensions.uiManagerModule
import com.bitmovin.player.reactnative.offline.OfflineContentManagerBridge
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
        val uiManager = runAndRejectOnException { uiManager } ?: return
        uiManager.addUIBlock {
            resolveOnCurrentThread { block() }
        }
    }

    protected val playerModule: PlayerModule get() = context.playerModule
        ?: throw IllegalArgumentException("PlayerModule not found")

    protected val uiManager: UIManagerModule get() = context.uiManagerModule
        ?: throw IllegalStateException("UIManager not found")

    protected val sourceModule: SourceModule get() = context.sourceModule
        ?: throw IllegalStateException("SourceModule not found")

    protected val offlineModule: OfflineModule get() = context.offlineModule
        ?: throw IllegalStateException("OfflineModule not found")

    protected val drmModule: DrmModule get() = context.drmModule
        ?: throw IllegalStateException("DrmModule not found")

    fun getPlayer(
        nativeId: NativeId,
        playerModule: PlayerModule = this.playerModule,
    ): Player = playerModule.getPlayerOrNull(nativeId) ?: throw IllegalArgumentException("Invalid PlayerId $nativeId")

    fun getSource(
        nativeId: NativeId,
        sourceModule: SourceModule = this.sourceModule,
    ): Source = sourceModule.getSourceOrNull(nativeId) ?: throw IllegalArgumentException("Invalid SourceId $nativeId")

    fun getOfflineContentManagerBridge(
        nativeId: NativeId,
        offlineModule: OfflineModule = this.offlineModule,
    ): OfflineContentManagerBridge = offlineModule.getOfflineContentManagerBridgeOrNull(nativeId)
        ?: throw IllegalArgumentException("Invalid offline content manager bridge id: $nativeId")
}

/** Compile time wrapper for Promises to type check the resolved type [T]. */
@JvmInline
value class TPromise<T>(val promise: Promise) {
    /**
     * Resolve the promise with [value], see [Promise.resolve].
     * Prefer [resolveOnCurrentThread] to automatically reject promise if an Exception is thrown.
     */
    // Promise only support built-in types. Functions that return [Unit] must resolve to `null`.
    fun resolve(value: T): Unit = promise.resolve(value.takeUnless { it is Unit })

    /**
     * Reject the promise due to [throwable], see [Promise.reject].
     * Prefer [resolveOnCurrentThread] or [runAndRejectOnException] instead for automatic rejecting.
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
