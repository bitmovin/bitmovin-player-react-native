package com.bitmovin.player.reactnative.ui

import android.webkit.JavascriptInterface
import com.bitmovin.player.reactnative.CustomMessageHandlerModule
import com.bitmovin.player.reactnative.NativeId
import com.bitmovin.player.ui.CustomMessageHandler

class CustomMessageHandlerBridge(
    private val nativeId: NativeId,
    private val module: CustomMessageHandlerModule? = null,
) {
    val customMessageHandler = CustomMessageHandler(
        object : Any() {
            @JavascriptInterface
            fun sendSynchronous(
                name: String,
                data: String?,
            ): String? = module?.receivedSynchronousMessage(nativeId, name, data)

            @JavascriptInterface
            fun sendAsynchronous(
                name: String,
                data: String?,
            ) = module?.receivedAsynchronousMessage(nativeId, name, data)
        },
    )

    fun sendMessage(message: String, data: String?) = customMessageHandler.sendMessage(message, data)
}
