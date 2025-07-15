package com.bitmovin.player.reactnative

import java.util.concurrent.ConcurrentHashMap
import java.util.concurrent.CountDownLatch
import java.util.concurrent.TimeUnit
import java.util.concurrent.atomic.AtomicInteger

/**
 * Lets native code synchronously wait for a value that will be supplied
 * later (typically from JavaScript).  Thread-safe, generic, timeout-aware.
 *
 *     val (id, wait) = boolWaiter.make(250)   // 250 ms
 *     sendEvent("...", mapOf("id" to id))
 *     val answer = wait() ?: false            // fallback on timeout
 */
class ResultWaiter<T> {

    private data class Entry<V>(
        val latch: CountDownLatch = CountDownLatch(1),
        @Volatile var value: V? = null,
    )

    private val nextId = AtomicInteger()
    private val table = ConcurrentHashMap<Int, Entry<T>>()

    /**
     * Registers a new waiter and returns:
     *   • id    – unique request handle
     *   • wait  – blocking lambda that returns null on timeout
     *
     * @param timeoutMs  max time the caller is willing to block
     */
    fun make(timeoutMs: Long): Pair<Int, () -> T?> {
        val id = nextId.incrementAndGet()
        val entry = Entry<T>()
        table[id] = entry

        val waitFn = {
            entry.latch.await(timeoutMs, TimeUnit.MILLISECONDS)
            table.remove(id) // GC once done
            entry.value
        }

        return id to waitFn
    }

    /** Completes the waiter if it exists; does nothing otherwise. */
    fun complete(id: Int, value: T) {
        table[id]?.let {
            it.value = value
            it.latch.countDown()
        }
    }
}
