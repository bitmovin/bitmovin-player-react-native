package com.bitmovin.player.reactnative

import expo.modules.kotlin.jni.JavaScriptObject
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class FullscreenHandlerModule : Module() {
    override fun definition() = ModuleDefinition {
        Name("FullscreenHandlerModule")
        Class(SharedFullscreenHandler::class) {
            Constructor { config: JavaScriptObject ->
                SharedFullscreenHandler(
                    appContext,
                    config,
                    this@FullscreenHandlerModule,
                )
            }
            AsyncFunction("setIsFullscreenActive") { owner: SharedFullscreenHandler, enabled: Boolean ->
                owner.isFullscreen = enabled
            }
            AsyncFunction("destroy", SharedFullscreenHandler::destroy)
        }
    }
}
