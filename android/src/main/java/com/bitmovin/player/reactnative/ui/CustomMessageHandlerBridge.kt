package com.bitmovin.player.reactnative.ui

import android.webkit.JavascriptInterface
import com.bitmovin.player.reactnative.NativeId
import com.bitmovin.player.reactnative.extensions.getModule
import com.bitmovin.player.ui.CustomMessageHandler
import com.facebook.react.bridge.ReactApplicationContext

class CustomMessageHandlerBridge(
    val context: ReactApplicationContext,
    private val nativeId: NativeId
): Any() {
    val customMessageHandler = CustomMessageHandler(this)
    private var currentSynchronousResult: String? = null

    @JavascriptInterface
    fun synchronousMessage(message: String, data: String?): String? = context
            .getModule<CustomMessageHandlerModule>()
            ?.receivedSynchronousMessage(nativeId, message, data)

    @JavascriptInterface
    fun asynchronousMessage(message: String, data: String?) = context
            .getModule<CustomMessageHandlerModule>()
            ?.receivedAsynchronousMessage(nativeId, message, data)

    fun sendMessage(message: String, data: String?) =
            customMessageHandler.sendMessage(message, data)

    fun popSynchronousResult(): String? = currentSynchronousResult?.let {
        currentSynchronousResult = null
        return it
    }

    fun pushSynchronousResult(result: String?) {
        currentSynchronousResult = result
    }
}
