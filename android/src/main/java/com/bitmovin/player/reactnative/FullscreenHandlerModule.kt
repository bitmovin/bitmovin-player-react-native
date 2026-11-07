package com.bitmovin.player.reactnative

import com.bitmovin.player.api.ui.FullscreenHandler
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.jni.JavaScriptFunction
import expo.modules.kotlin.jni.JavaScriptValue
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import expo.modules.kotlin.sharedobjects.SharedObject

class SharedFullscreen(appContext: AppContext, callback: JavaScriptFunction<JavaScriptValue>?) :
    SharedObject(appContext), FullscreenHandler {
    private val callbacks = CallbackScope(appContext, callback)
    override var isFullscreen = false
    override fun onFullscreenRequested() {
        (callbacks.call("enterFullscreen", emptyList(), 250) as? Boolean)?.let { isFullscreen = it }
    }
    override fun onFullscreenExitRequested() {
        (callbacks.call("exitFullscreen", emptyList(), 250) as? Boolean)?.let { isFullscreen = it }
    }
    override fun onDestroy() = Unit
    override fun onPause() = Unit
    override fun onResume() = Unit
    fun destroy() = callbacks.close()
    override fun sharedObjectDidRelease() = destroy()
}

class FullscreenHandlerModule : Module() {
    override fun definition() = ModuleDefinition {
        Name("FullscreenHandlerModule")
        Function("create") { callback: JavaScriptFunction<JavaScriptValue>? -> SharedFullscreen(appContext, callback) }
        Class(SharedFullscreen::class) {
            Constructor { callback: JavaScriptFunction<JavaScriptValue>? -> SharedFullscreen(appContext, callback) }
            AsyncFunction("setIsFullscreenActive") { owner: SharedFullscreen, enabled: Boolean ->
                owner.isFullscreen = enabled
            }
            AsyncFunction("destroy") { owner: SharedFullscreen -> owner.destroy() }
        }
    }
}
