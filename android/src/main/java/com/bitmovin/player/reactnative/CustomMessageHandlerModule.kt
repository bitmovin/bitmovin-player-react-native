package com.bitmovin.player.reactnative

import expo.modules.kotlin.jni.JavaScriptValue
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class CustomMessageHandlerModule : Module() {
    override fun definition() = ModuleDefinition {
        Name("CustomMessageHandlerModule")
        Class(SharedCustomMessageHandler::class) {
            Constructor { config: JavaScriptValue ->
                SharedCustomMessageHandler(appContext, config.getObject(), this@CustomMessageHandlerModule)
            }
            AsyncFunction("sendMessage") { owner: SharedCustomMessageHandler, message: String, data: String? ->
                owner.customMessageHandler.sendMessage(message, data)
            }
            AsyncFunction("destroy", SharedCustomMessageHandler::destroy)
        }
    }
}
