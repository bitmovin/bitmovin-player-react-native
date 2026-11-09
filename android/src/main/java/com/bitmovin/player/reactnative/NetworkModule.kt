package com.bitmovin.player.reactnative

import expo.modules.kotlin.exception.CodedException
import expo.modules.kotlin.jni.JavaScriptFunction
import expo.modules.kotlin.jni.JavaScriptValue
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class NetworkModule : Module() {
    private fun create(config: Map<String, Any?>, callback: JavaScriptFunction<JavaScriptValue>?): SharedNetworkConfig =
        try {
            SharedNetworkConfig(appContext, config, callback)
        } catch (error: Exception) {
            throw CodedException("NetworkError", "Failed to initialize network config", error)
        }

    override fun definition() = ModuleDefinition {
        Name("NetworkModule")
        Function("create") { config: Map<String, Any?>, callback: JavaScriptFunction<JavaScriptValue>? ->
            create(config, callback)
        }
        Class(SharedNetworkConfig::class) {
            Constructor { config: Map<String, Any?>, callback: JavaScriptFunction<JavaScriptValue>? ->
                create(config, callback)
            }
            AsyncFunction("destroy") { owner: SharedNetworkConfig -> owner.destroy() }
        }
    }
}
