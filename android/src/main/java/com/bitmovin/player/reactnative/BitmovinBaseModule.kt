package com.bitmovin.player.reactnative

import com.bitmovin.player.api.Player
import com.bitmovin.player.reactnative.extensions.offlineModule
import com.bitmovin.player.reactnative.extensions.playerModule
import com.bitmovin.player.reactnative.extensions.sourceModule
import com.bitmovin.player.reactnative.extensions.uiManagerModule
import com.facebook.react.bridge.*
import com.facebook.react.uimanager.UIManagerModule

/**
 * Base for Bitmovin React Module.
 *
 * Provides many helper methods that are promise exception safe.
 *
 * In general, code should not throw while resolving a [Promise]. Instead, [Promise.reject] should be used.
 * This doesn't match Kotlin's error style, which uses exception. The helper methods in this class, provide such
 * convenience, they can only be called in a context that will catch any Exception and reject the [Promise].
 */
abstract class BitmovinBaseModule(
    protected val context: ReactApplicationContext,
) : ReactContextBaseJavaModule(context) {
    /** [resolve] the [Promise] by running [block] in the UI thread with [UIManagerModule.addUIBlock].  */
    protected inline fun <T> Promise.resolveOnUIThread(crossinline block: PromiseRejectOnExceptionBlock.() -> T) {
        val uiManager = runAndRejectOnException { uiManager } ?: return
        uiManager.addUIBlock {
            runAndRejectOnException {
                resolve(block())
            }
        }
    }

    protected val PromiseRejectOnExceptionBlock.playerModule: PlayerModule get() = context.playerModule
        ?: throw IllegalArgumentException("PlayerModule not found")

    protected val PromiseRejectOnExceptionBlock.uiManager: UIManagerModule get() = context.uiManagerModule
        ?: throw IllegalStateException("UIManager not found")

    protected val PromiseRejectOnExceptionBlock.sourceModule: SourceModule get() = context.sourceModule
        ?: throw IllegalStateException("SourceModule not found")

    protected val PromiseRejectOnExceptionBlock.offlineModule: OfflineModule get() = context.offlineModule
        ?: throw IllegalStateException("OfflineModule not found")

    fun PromiseRejectOnExceptionBlock.getPlayer(nativeId: NativeId): Player = playerModule.getPlayerOrNull(nativeId)
        ?: throw IllegalArgumentException("Invalid PlayerId")
}

/** Run [block], forwarding the return value. If it throws, sets [Promise.reject] and return null. */
inline fun <T> Promise.runAndRejectOnException(crossinline block: PromiseRejectOnExceptionBlock.() -> T): T? = try {
    PromiseRejectOnExceptionBlock.block()
} catch (e: Exception) {
    reject(e)
    null
}

/** Receiver of code that can safely throw when resolving a [Promise]. */
object PromiseRejectOnExceptionBlock
