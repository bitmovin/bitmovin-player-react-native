package com.bitmovin.player.reactnative

import com.bitmovin.player.api.ui.FullscreenHandler
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.jni.JavaScriptObject
import expo.modules.kotlin.sharedobjects.SharedObject

class SharedFullscreenHandler(appContext: AppContext, config: JavaScriptObject) :
    SharedObject(appContext), FullscreenHandler {
    private val context = appContext
    private var enter = config.getProperty("enterFullscreen").takeIf { it.isFunction() }?.getObject()?.createWeak()
    private var exit = config.getProperty("exitFullscreen").takeIf { it.isFunction() }?.getObject()?.createWeak()
    override var isFullscreen = false
    override fun onFullscreenRequested() {
        enter?.callBlocking(context) { if (it.isBool()) it.getBool() else null }?.let { isFullscreen = it }
    }
    override fun onFullscreenExitRequested() {
        exit?.callBlocking(context) { if (it.isBool()) it.getBool() else null }?.let { isFullscreen = it }
    }
    override fun onDestroy() = Unit
    override fun onPause() = Unit
    override fun onResume() = Unit
    fun destroy() {
        enter = null
        exit = null
    }
    override fun sharedObjectDidRelease() = destroy()
}
