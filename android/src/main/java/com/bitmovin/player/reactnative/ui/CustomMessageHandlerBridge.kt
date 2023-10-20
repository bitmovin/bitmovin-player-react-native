package com.bitmovin.player.reactnative.ui

import android.webkit.JavascriptInterface
import com.bitmovin.player.reactnative.NativeId
import com.bitmovin.player.reactnative.extensions.getModule
import com.bitmovin.player.ui.CustomMessageHandler
import com.facebook.react.bridge.ReactApplicationContext

class CustomMessageHandlerBridge(
    val context: ReactApplicationContext,
    private val nativeId: NativeId,
) {
    val customMessageHandler = CustomMessageHandler(
        object : Any() {
            @JavascriptInterface
            fun sendSynchronous(name: String, data: String?): String? = context
                .getModule<CustomMessageHandlerModule>()
                ?.receivedSynchronousMessage(nativeId, name, data)

            @JavascriptInterface
            fun sendAsynchronous(name: String, data: String?) = context
                .getModule<CustomMessageHandlerModule>()
                ?.receivedAsynchronousMessage(nativeId, name, data)
        },
    )

    private var currentSynchronousResult: String? = null

    fun sendMessage(message: String, data: String?) = customMessageHandler.sendMessage(message, data)

    fun popSynchronousResult(): String? = currentSynchronousResult?.let {
        currentSynchronousResult = null
        return it
    }

    fun pushSynchronousResult(result: String?) {
        currentSynchronousResult = result
    }
}
