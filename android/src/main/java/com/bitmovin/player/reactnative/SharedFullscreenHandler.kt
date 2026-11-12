package com.bitmovin.player.reactnative

import com.bitmovin.player.api.ui.FullscreenHandler
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.jni.JavaScriptObject
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.sharedobjects.SharedObject

class SharedFullscreenHandler(appContext: AppContext, config: JavaScriptObject, module: Module) :
    SharedObject(appContext), FullscreenHandler {
    private val callbacks = JavaScriptCallbacks(appContext, module)
    private val options = callbacks.snapshot(config)!!
    private val enter = options["enterFullscreen"] as? JavaScriptCallback
    private val exit = options["exitFullscreen"] as? JavaScriptCallback
    override var isFullscreen = false
    override fun onFullscreenRequested() {
        (enter?.blockingCall(emptyList()) as? Boolean)?.let { isFullscreen = it }
    }
    override fun onFullscreenExitRequested() {
        (exit?.blockingCall(emptyList()) as? Boolean)?.let { isFullscreen = it }
    }
    override fun onDestroy() = Unit
    override fun onPause() = Unit
    override fun onResume() = Unit
    fun destroy() = callbacks.close()
    override fun sharedObjectDidRelease() = destroy()
}
