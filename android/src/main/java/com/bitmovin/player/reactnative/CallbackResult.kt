package com.bitmovin.player.reactnative

import expo.modules.kotlin.AppContext
import expo.modules.kotlin.sharedobjects.SharedObject
import java.util.concurrent.atomic.AtomicReference

/** A completion belongs to one invocation; no identity or lookup table crosses the bridge. */
class CallbackResult(appContext: AppContext, complete: (Any?) -> Unit = {}) : SharedObject(appContext) {
    private val complete = AtomicReference<((Any?) -> Unit)?>(complete)
    fun resolve(value: Any?) { complete.getAndSet(null)?.invoke(value) }
    override fun sharedObjectDidRelease() = resolve(null)
}
