package com.bitmovin.player.reactnative

import expo.modules.kotlin.jni.JavaScriptFunction
import expo.modules.kotlin.jni.JavaScriptValue
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class CustomMessageHandlerModule : Module() {
    override fun definition() = ModuleDefinition {
        Name("CustomMessageHandlerModule")
        Class("SharedCustomMessageHandler", SharedCustomMessageHandler::class) {
            Constructor { config: Map<String, String>, callback: JavaScriptFunction<JavaScriptValue>? ->
                SharedCustomMessageHandler(appContext, config, callback)
            }
            AsyncFunction("sendMessage") { owner: SharedCustomMessageHandler, message: String, data: String? ->
                owner.customMessageHandler.sendMessage(message, data)
            }
            AsyncFunction("destroy") { owner: SharedCustomMessageHandler -> owner.destroy() }
        }
    }
}
