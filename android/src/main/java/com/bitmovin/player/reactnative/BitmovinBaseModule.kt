package com.bitmovin.player.reactnative

import com.bitmovin.player.reactnative.extensions.offlineModule
import com.bitmovin.player.reactnative.extensions.playerModule
import com.bitmovin.player.reactnative.extensions.sourceModule
import com.bitmovin.player.reactnative.extensions.uiManagerModule
import com.facebook.react.bridge.*
import com.facebook.react.uimanager.UIManagerModule

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
