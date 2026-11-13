package com.bitmovin.player.reactnative

import android.webkit.JavascriptInterface
import com.bitmovin.player.ui.CustomMessageHandler
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.jni.JavaScriptObject
import expo.modules.kotlin.sharedobjects.SharedObject
import kotlin.time.Duration.Companion.seconds

class SharedCustomMessageHandler(appContext: AppContext, config: JavaScriptObject) : SharedObject(appContext) {
    private val context = appContext

    @Volatile private var onReceivedSynchronousMessage = config.getWeakCallback("onReceivedSynchronousMessage")

    @Volatile private var onReceivedAsynchronousMessage = config.getWeakCallback("onReceivedAsynchronousMessage")
    val customMessageHandler = CustomMessageHandler(this)

    @JavascriptInterface
    fun sendSynchronous(name: String, data: String?): String? {
        val arguments = if (data == null) arrayOf(name) else arrayOf(name, data)
        return onReceivedSynchronousMessage?.callBlocking(context, *arguments, timeout = 5.seconds) {
            if (it.isString()) it.getString() else null
        }
    }

    @JavascriptInterface
    fun sendAsynchronous(name: String, data: String?) {
        val arguments = if (data == null) arrayOf(name) else arrayOf(name, data)
        if (onReceivedAsynchronousMessage == null) return
        runCatching {
            context.runtime.schedule {
                runCatching { onReceivedAsynchronousMessage?.callBlocking(context, *arguments) { Unit } }
            }
        }
    }
    fun destroy() {
        onReceivedSynchronousMessage = null
        onReceivedAsynchronousMessage = null
    }
    override fun sharedObjectDidRelease() = destroy()
}
