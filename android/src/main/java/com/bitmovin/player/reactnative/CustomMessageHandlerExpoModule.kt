package com.bitmovin.player.reactnative

import com.bitmovin.player.reactnative.ui.CustomMessageHandlerBridge
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import expo.modules.kotlin.Promise
import java.util.concurrent.locks.ReentrantLock
import kotlin.concurrent.withLock

private const val MODULE_NAME = "CustomMessageHandlerExpoModule"

/**
 * Expo module for CustomMessageHandler management with bidirectional communication.
 * Handles synchronous and asynchronous message handling between native code and JavaScript.
 */
class CustomMessageHandlerExpoModule : Module() {
    /**
     * In-memory mapping from `nativeId`s to `CustomMessageHandlerBridge` instances.
     */
    private val customMessageHandlers: Registry<CustomMessageHandlerBridge> = mutableMapOf()

    /**
     * Module's local lock object used to sync calls between Kotlin and JS.
     */
    private val lock = ReentrantLock()

    /**
     * Lock condition used to sync operations on the custom message handler.
     */
    private val customMessageHandlerResultChangedCondition = lock.newCondition()

    override fun definition() = ModuleDefinition {
        Name(MODULE_NAME)

        AsyncFunction("registerHandler") { nativeId: String ->
            val customMessageHandler = customMessageHandlers[nativeId] ?: CustomMessageHandlerBridge(nativeId, this@CustomMessageHandlerExpoModule)
            customMessageHandlers[nativeId] = customMessageHandler
        }

        AsyncFunction("destroy") { nativeId: String ->
            customMessageHandlers.remove(nativeId)
        }

        AsyncFunction("onReceivedSynchronousMessageResult") { nativeId: String, result: String? ->
            customMessageHandlers[nativeId]?.pushSynchronousResult(result)
            lock.withLock {
                customMessageHandlerResultChangedCondition.signal()
            }
        }

        AsyncFunction("sendMessage") { nativeId: String, message: String, data: String? ->
            customMessageHandlers[nativeId]?.sendMessage(message, data)
        }
    }

    /**
     * Retrieves the CustomMessageHandlerBridge instance for the given nativeId.
     * This method maintains the same static access pattern as the legacy module.
     */
    fun getInstance(nativeId: String?): CustomMessageHandlerBridge? = customMessageHandlers[nativeId]

    /**
     * Handles synchronous message received from native code.
     * Called by CustomMessageHandlerBridge when a synchronous message is received.
     */
    fun receivedSynchronousMessage(nativeId: String, message: String, data: String?): String? {
        lock.withLock {
            // Send event to JavaScript via React Native bridge
            (appContext.reactContext!!.applicationContext as com.facebook.react.bridge.ReactApplicationContext).let { context: com.facebook.react.bridge.ReactApplicationContext ->
                val args = com.facebook.react.bridge.Arguments.createArray()
                args.pushString(message)
                args.pushString(data)
                
                // TODO: Use Expo module event system instead of React Native bridge
                // This is a placeholder - implement proper event dispatch
                
                // For now, just return from the lock block
                return@withLock
            }
            
            customMessageHandlerResultChangedCondition.await()
        }
        return customMessageHandlers[nativeId]?.popSynchronousResult()
    }

    /**
     * Handles asynchronous message received from native code.
     * Called by CustomMessageHandlerBridge when an asynchronous message is received.
     */
    fun receivedAsynchronousMessage(nativeId: String, message: String, data: String?) {
        // Send event to JavaScript via React Native bridge
        (appContext.reactContext!!.applicationContext as com.facebook.react.bridge.ReactApplicationContext).let { context: com.facebook.react.bridge.ReactApplicationContext ->
            val args = com.facebook.react.bridge.Arguments.createArray()
            args.pushString(message)
            args.pushString(data)
            
            // TODO: Use Expo module event system instead of React Native bridge
            // This is a placeholder - implement proper event dispatch
        }
    }
}