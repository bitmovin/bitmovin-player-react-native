package com.bitmovin.player.reactnative

import androidx.core.os.bundleOf
import com.bitmovin.player.reactnative.ui.CustomMessageHandlerBridge
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

/**
 * Expo module for CustomMessageHandler management with bidirectional communication.
 * Handles synchronous and asynchronous message handling between native code and JavaScript.
 */
class CustomMessageHandlerModule : Module() {
    /**
     * In-memory mapping from `nativeId`s to `CustomMessageHandlerBridge` instances.
     */
    private val customMessageHandlers: Registry<CustomMessageHandlerBridge> = mutableMapOf()

    /**
     * ResultWaiter for synchronous message handling
     */
    private val synchronousMessageWaiter = ResultWaiter<String?>()

    override fun definition() = ModuleDefinition {
        Name("CustomMessageHandlerModule")

        OnDestroy {
            customMessageHandlers.clear()
            synchronousMessageWaiter.clear()
        }

        Events("onReceivedSynchronousMessage", "onReceivedAsynchronousMessage")

        AsyncFunction("registerHandler") { nativeId: NativeId ->
            val customMessageHandler = customMessageHandlers[nativeId] ?: CustomMessageHandlerBridge(
                nativeId,
                this@CustomMessageHandlerModule,
            )
            customMessageHandlers[nativeId] = customMessageHandler
        }

        AsyncFunction("destroy") { nativeId: NativeId ->
            customMessageHandlers.remove(nativeId)
        }

        AsyncFunction("onReceivedSynchronousMessageResult") { id: Int, result: String? ->
            synchronousMessageWaiter.complete(id, result)
        }

        AsyncFunction("sendMessage") { nativeId: NativeId, message: String, data: String? ->
            customMessageHandlers[nativeId]?.sendMessage(message, data)
        }
    }

    fun getInstance(nativeId: NativeId?): CustomMessageHandlerBridge? = customMessageHandlers[nativeId]

    fun receivedSynchronousMessage(nativeId: NativeId, message: String, data: String?): String? {
        val (id, wait) = synchronousMessageWaiter.make(5000) // 5 second timeout
        
        // Send event to TypeScript using Expo module event system
        sendEvent(
            "onReceivedSynchronousMessage",
            bundleOf(
                "nativeId" to nativeId,
                "id" to id,
                "message" to message,
                "data" to data,
            ),
        )

        return wait()
    }

    fun receivedAsynchronousMessage(nativeId: NativeId, message: String, data: String?) {
        // Send event to TypeScript using Expo module event system
        sendEvent(
            "onReceivedAsynchronousMessage",
            bundleOf(
                "nativeId" to nativeId,
                "message" to message,
                "data" to data,
            ),
        )
    }
}
