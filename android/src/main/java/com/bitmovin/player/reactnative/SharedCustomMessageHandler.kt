package com.bitmovin.player.reactnative

import android.webkit.JavascriptInterface
import com.bitmovin.player.ui.CustomMessageHandler
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.jni.JavaScriptObject
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.sharedobjects.SharedObject

class SharedCustomMessageHandler(
    appContext: AppContext,
    config: JavaScriptObject,
    module: Module,
) : SharedObject(appContext) {
    private val callbacks = JavaScriptCallbacks(appContext, module)
    private val options = callbacks.snapshot(config)!!
    private val synchronousMessage = options["onReceivedSynchronousMessage"] as? JavaScriptCallback
    private val asynchronousMessage = options["onReceivedAsynchronousMessage"] as? JavaScriptCallback
    val customMessageHandler = CustomMessageHandler(
        object : Any() {
            @JavascriptInterface
            fun sendSynchronous(name: String, data: String?): String? =
                synchronousMessage?.blockingCall(listOf(name, data), undefinedIndex = 1) as? String

            @JavascriptInterface
            fun sendAsynchronous(name: String, data: String?) {
                asynchronousMessage?.emit(listOf(name, data), undefinedIndex = 1)
            }
        },
    )
    fun destroy() = callbacks.close()
    override fun sharedObjectDidRelease() = destroy()
}
