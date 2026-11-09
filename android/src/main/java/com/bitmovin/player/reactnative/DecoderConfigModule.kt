package com.bitmovin.player.reactnative

import expo.modules.kotlin.jni.JavaScriptFunction
import expo.modules.kotlin.jni.JavaScriptValue
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class DecoderConfigModule : Module() {
    override fun definition() = ModuleDefinition {
        Name("DecoderConfigModule")
        Function("create") { config: Map<String, Any?>, callback: JavaScriptFunction<JavaScriptValue>? ->
            SharedDecoderConfig(appContext, config, callback)
        }
        Class(SharedDecoderConfig::class) {
            Constructor { config: Map<String, Any?>, callback: JavaScriptFunction<JavaScriptValue>? ->
                SharedDecoderConfig(appContext, config, callback)
            }
            AsyncFunction("destroy") { owner: SharedDecoderConfig -> owner.destroy() }
        }
    }
}
