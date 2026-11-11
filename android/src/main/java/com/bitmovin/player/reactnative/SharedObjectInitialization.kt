package com.bitmovin.player.reactnative

import android.os.Looper

/** A synchronous SDK factory materialized only by main-queue native operations. */
internal class SharedObjectInitialization<T>(factory: () -> T) {
    private var factory: (() -> T)? = factory
    private var result: Result<T>? = null

    fun get(): T {
        check(Looper.myLooper() == Looper.getMainLooper()) { "SDK objects must be accessed on the main thread" }
        val initialized = result ?: runCatching { checkNotNull(factory)() }.also {
            result = it
            factory = null
        }
        return initialized.getOrThrow()
    }

    val initializedValue: T?
        get() = result?.getOrNull()

    fun cancel() {
        if (result == null) {
            factory = null
            result = Result.failure(IllegalStateException("Destroyed before SDK initialization"))
        }
    }
}
