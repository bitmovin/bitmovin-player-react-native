package com.bitmovin.player.reactnative

import com.bitmovin.player.api.network.PreprocessHttpRequestCallback
import com.bitmovin.player.api.network.PreprocessHttpResponseCallback
import com.bitmovin.player.reactnative.converter.toHttpRequest
import com.bitmovin.player.reactnative.converter.toHttpResponse
import com.bitmovin.player.reactnative.converter.toJson
import com.bitmovin.player.reactnative.converter.toNetworkConfig
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.exception.CodedException
import expo.modules.kotlin.jni.JavaScriptFunction
import expo.modules.kotlin.jni.JavaScriptValue
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import expo.modules.kotlin.sharedobjects.SharedObject

class SharedNetwork(appContext: AppContext, config: Map<String, Any?>, callback: JavaScriptFunction<JavaScriptValue>?) :
    SharedObject(appContext) {
    private val callbacks = CallbackScope(appContext, callback)
    val config = config.toNetworkConfig().apply {
        if (config.containsKey("preprocessHttpRequest")) {
            preprocessHttpRequestCallback = PreprocessHttpRequestCallback { type, request ->
                callbacks.future("preprocessHttpRequest", listOf(type.toJson(), request.toJson()), request) {
                    @Suppress("UNCHECKED_CAST")
                    (it as Map<String, Any?>).toHttpRequest()
                }
            }
        }
        if (config.containsKey("preprocessHttpResponse")) {
            preprocessHttpResponseCallback = PreprocessHttpResponseCallback { type, response ->
                callbacks.future("preprocessHttpResponse", listOf(type.toJson(), response.toJson()), response) {
                    @Suppress("UNCHECKED_CAST")
                    (it as Map<String, Any?>).toHttpResponse()
                }
            }
        }
    }
    fun destroy() = callbacks.close()
    override fun sharedObjectDidRelease() = destroy()
}

class NetworkModule : Module() {
    private fun create(config: Map<String, Any?>, callback: JavaScriptFunction<JavaScriptValue>?): SharedNetwork =
        try {
            SharedNetwork(appContext, config, callback)
        } catch (error: Exception) {
            throw CodedException("NetworkError", "Failed to initialize network config", error)
        }

    override fun definition() = ModuleDefinition {
        Name("NetworkModule")
        Function("create") { config: Map<String, Any?>, callback: JavaScriptFunction<JavaScriptValue>? ->
            create(config, callback)
        }
        Class(SharedNetwork::class) {
            Constructor { config: Map<String, Any?>, callback: JavaScriptFunction<JavaScriptValue>? ->
                create(config, callback)
            }
            AsyncFunction("destroy") { owner: SharedNetwork -> owner.destroy() }
        }
    }
}
