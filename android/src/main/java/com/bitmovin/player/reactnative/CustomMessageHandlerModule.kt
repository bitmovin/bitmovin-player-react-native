package com.bitmovin.player.reactnative

import expo.modules.kotlin.jni.JavaScriptFunction
import expo.modules.kotlin.jni.JavaScriptValue
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class CustomMessageHandlerModule : Module() {
    override fun definition() = ModuleDefinition {
        Name("CustomMessageHandlerModule")
        Function("create") { callback: JavaScriptFunction<JavaScriptValue>? ->
            SharedCustomMessage(appContext, callback)
        }
        Class(SharedCustomMessage::class) {
            Constructor { callback: JavaScriptFunction<JavaScriptValue>? -> SharedCustomMessage(appContext, callback) }
            AsyncFunction("sendMessage") { owner: SharedCustomMessage, message: String, data: String? ->
                owner.customMessageHandler.sendMessage(message, data)
            }
            AsyncFunction("destroy") { owner: SharedCustomMessage -> owner.destroy() }
        }
    }
}
