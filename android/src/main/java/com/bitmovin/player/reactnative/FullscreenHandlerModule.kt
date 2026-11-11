package com.bitmovin.player.reactnative

import expo.modules.kotlin.jni.JavaScriptFunction
import expo.modules.kotlin.jni.JavaScriptValue
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class FullscreenHandlerModule : Module() {
    override fun definition() = ModuleDefinition {
        Name("FullscreenHandlerModule")
        Class("FullscreenHandler", SharedFullscreen::class) {
            Constructor { callback: JavaScriptFunction<JavaScriptValue>? -> SharedFullscreen(appContext, callback) }
            AsyncFunction("setIsFullscreenActive") { owner: SharedFullscreen, enabled: Boolean ->
                owner.isFullscreen = enabled
            }
            AsyncFunction("destroy") { owner: SharedFullscreen -> owner.destroy() }
        }
    }
}
