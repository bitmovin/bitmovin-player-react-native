package com.bitmovin.player.reactnative.ui

import com.bitmovin.player.reactnative.NativeId
import com.bitmovin.player.reactnative.Registry
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.NativeArray
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.module.annotations.ReactModule
import java.util.concurrent.locks.ReentrantLock
import kotlin.concurrent.withLock

private const val MODULE_NAME = "CustomMessageHandlerModule"

@ReactModule(name = MODULE_NAME)
class CustomMessageHandlerModule(private val context: ReactApplicationContext) : ReactContextBaseJavaModule(context) {
    override fun getName() = MODULE_NAME

    /**
     * In-memory mapping from `nativeId`s to `CustomMessageHandler` instances.
     */
    private val customMessageHandler: Registry<CustomMessageHandlerBridge> = mutableMapOf()

    /**
     * Module's local lock object used to sync calls between Kotlin and JS.
     */
    private val lock = ReentrantLock()

    /**
     *  Lock condition used to sync operations on the fullscreen handler.
     */
    private val customMessageHandlerResultChangedCondition = lock.newCondition()

    fun getInstance(nativeId: NativeId?): CustomMessageHandlerBridge? = customMessageHandler[nativeId]

    @ReactMethod(isBlockingSynchronousMethod = true)
    fun onReceivedSynchronousMessageResult(nativeId: NativeId, result: String?) {
        customMessageHandler[nativeId]?.pushSynchronousResult(result)
        lock.withLock {
            customMessageHandlerResultChangedCondition.signal()
        }
    }

    @ReactMethod
    fun sendMessage(nativeId: NativeId, message: String, data: String?) {
        customMessageHandler[nativeId]?.sendMessage(message, data)
    }

    @ReactMethod
    fun registerHandler(nativeId: NativeId) {
        val customMessageHandler = customMessageHandler[nativeId] ?: CustomMessageHandlerBridge(context, nativeId)
        this.customMessageHandler[nativeId] = customMessageHandler
    }

    @ReactMethod
    fun destroy(nativeId: NativeId) {
        customMessageHandler.remove(nativeId)
    }

    fun receivedSynchronousMessage(nativeId: NativeId, message: String, data: String?): String? {
        val args = Arguments.createArray()
        args.pushString(message)
        args.pushString(data)
        lock.withLock {
            context.catalystInstance.callFunction(
                "CustomMessageBridge-$nativeId",
                "receivedSynchronousMessage",
                args as NativeArray,
            )
            customMessageHandlerResultChangedCondition.await()
        }
        return customMessageHandler[nativeId]?.popSynchronousResult()
    }

    fun receivedAsynchronousMessage(nativeId: NativeId, message: String, data: String?) {
        val args = Arguments.createArray()
        args.pushString(message)
        args.pushString(data)
        context.catalystInstance.callFunction(
            "CustomMessageBridge-$nativeId",
            "receivedAsynchronousMessage",
            args as NativeArray,
        )
    }
}
