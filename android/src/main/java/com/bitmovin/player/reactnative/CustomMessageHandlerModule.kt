package com.bitmovin.player.reactnative

import expo.modules.kotlin.jni.JavaScriptFunction
import expo.modules.kotlin.jni.JavaScriptValue
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class CustomMessageHandlerModule : Module() {
    override fun definition() = ModuleDefinition {
        Name("CustomMessageHandlerModule")
        Class("CustomMessageHandler", SharedCustomMessage::class) {
            Constructor { config: Map<String, String>, callback: JavaScriptFunction<JavaScriptValue>? ->
                SharedCustomMessage(appContext, config, callback)
            }
            AsyncFunction("sendMessage") { owner: SharedCustomMessage, message: String, data: String? ->
                owner.customMessageHandler.sendMessage(message, data)
            }
            AsyncFunction("destroy") { owner: SharedCustomMessage -> owner.destroy() }
        }
    }
}
