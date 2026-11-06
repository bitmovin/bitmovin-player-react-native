package com.bitmovin.player.reactnative

import android.webkit.JavascriptInterface
import com.bitmovin.player.ui.CustomMessageHandler
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.jni.JavaScriptFunction
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import expo.modules.kotlin.sharedobjects.SharedObject

class SharedCustomMessage(appContext: AppContext, callback: JavaScriptFunction<Any?>?) : SharedObject(appContext) {
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

class CustomMessageHandlerModule : Module() {
    override fun definition() = ModuleDefinition {
        Name("CustomMessageHandlerModule")
        Function("create") { callback: JavaScriptFunction<Any?>? -> SharedCustomMessage(appContext, callback) }
        Class(SharedCustomMessage::class) {
            Constructor { callback: JavaScriptFunction<Any?>? -> SharedCustomMessage(appContext, callback) }
            AsyncFunction("sendMessage") { owner: SharedCustomMessage, message: String, data: String? ->
                owner.customMessageHandler.sendMessage(message, data)
            }
            AsyncFunction("destroy") { owner: SharedCustomMessage -> owner.destroy() }
        }
    }
}
