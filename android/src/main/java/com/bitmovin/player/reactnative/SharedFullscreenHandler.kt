package com.bitmovin.player.reactnative

import com.bitmovin.player.api.ui.FullscreenHandler
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.jni.JavaScriptFunction
import expo.modules.kotlin.jni.JavaScriptValue
import expo.modules.kotlin.sharedobjects.SharedObject

class SharedFullscreenHandler(appContext: AppContext, callback: JavaScriptFunction<JavaScriptValue>?) :
    SharedObject(appContext), FullscreenHandler {
    private val callbacks = CallbackScope(appContext, callback)
    override var isFullscreen = false
    override fun onFullscreenRequested() {
        (callbacks.call("enterFullscreen", emptyList()) as? Boolean)?.let { isFullscreen = it }
    }
    override fun onFullscreenExitRequested() {
        (callbacks.call("exitFullscreen", emptyList()) as? Boolean)?.let { isFullscreen = it }
    }
    override fun onDestroy() = Unit
    override fun onPause() = Unit
    override fun onResume() = Unit
    fun destroy() = callbacks.close()
    override fun sharedObjectDidRelease() = destroy()
}
