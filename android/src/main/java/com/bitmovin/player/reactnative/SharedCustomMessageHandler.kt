package com.bitmovin.player.reactnative

import android.webkit.JavascriptInterface
import com.bitmovin.player.ui.CustomMessageHandler
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.jni.JavaScriptObject
import expo.modules.kotlin.sharedobjects.SharedObject

class SharedCustomMessageHandler(appContext: AppContext, config: JavaScriptObject) : SharedObject(appContext) {
    private val context = appContext

    @Volatile private var synchronousMessage = config.getProperty("onReceivedSynchronousMessage")
        .takeIf { it.isFunction() }?.getObject()?.createWeak()

    @Volatile private var asynchronousMessage = config.getProperty("onReceivedAsynchronousMessage")
        .takeIf { it.isFunction() }?.getObject()?.createWeak()
    val customMessageHandler = CustomMessageHandler(this)

    @JavascriptInterface
    fun sendSynchronous(name: String, data: String?): String? {
        val arguments = if (data == null) arrayOf(name) else arrayOf(name, data)
        return synchronousMessage?.callBlocking(context, *arguments) { if (it.isString()) it.getString() else null }
    }

    @JavascriptInterface
    fun sendAsynchronous(name: String, data: String?) {
        val arguments = if (data == null) arrayOf(name) else arrayOf(name, data)
        if (asynchronousMessage == null) return
        runCatching {
            context.runtime.schedule {
                runCatching { asynchronousMessage?.callBlocking(context, *arguments) { Unit } }
            }
        }
    }
    fun destroy() {
        synchronousMessage = null
        asynchronousMessage = null
    }
    override fun sharedObjectDidRelease() = destroy()
}
