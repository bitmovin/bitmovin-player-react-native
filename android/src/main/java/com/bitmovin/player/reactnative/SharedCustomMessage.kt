package com.bitmovin.player.reactnative

import android.webkit.JavascriptInterface
import com.bitmovin.player.ui.CustomMessageHandler
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.jni.JavaScriptFunction
import expo.modules.kotlin.jni.JavaScriptValue
import expo.modules.kotlin.sharedobjects.SharedObject

class SharedCustomMessage(appContext: AppContext, callback: JavaScriptFunction<JavaScriptValue>?) : SharedObject(
    appContext,
) {
    private val callbacks = CallbackScope(appContext, callback)
    val customMessageHandler = CustomMessageHandler(
        object : Any() {
            @JavascriptInterface
            fun sendSynchronous(name: String, data: String?): String? =
                callbacks.call("synchronousMessage", listOf(name, data), 5000) as? String

            @JavascriptInterface
            fun sendAsynchronous(name: String, data: String?) =
                callbacks.notify("asynchronousMessage", listOf(name, data))
        },
    )
    fun destroy() = callbacks.close()
    override fun sharedObjectDidRelease() = destroy()
}
