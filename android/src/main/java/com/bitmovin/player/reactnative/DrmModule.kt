package com.bitmovin.player.reactnative

import expo.modules.kotlin.exception.CodedException
import expo.modules.kotlin.jni.JavaScriptFunction
import expo.modules.kotlin.jni.JavaScriptValue
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class DrmModule : Module() {
    private fun create(config: Map<String, Any?>, callback: JavaScriptFunction<JavaScriptValue>?): SharedDrmConfig =
        try {
            SharedDrmConfig(appContext, config, callback)
        } catch (error: Exception) {
            throw CodedException("DrmError", "Failed to initialize DRM config", error)
        }

    override fun definition() = ModuleDefinition {
        Name("DrmModule")
        Function("create") { config: Map<String, Any?>, callback: JavaScriptFunction<JavaScriptValue>? ->
            create(config, callback)
        }
        Class(SharedDrmConfig::class) {
            Constructor { config: Map<String, Any?>, callback: JavaScriptFunction<JavaScriptValue>? ->
                create(config, callback)
            }
            AsyncFunction("destroy") { owner: SharedDrmConfig -> owner.destroy() }
        }
    }
}
