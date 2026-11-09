package com.bitmovin.player.reactnative

import com.bitmovin.player.api.network.PreprocessHttpRequestCallback
import com.bitmovin.player.api.network.PreprocessHttpResponseCallback
import com.bitmovin.player.reactnative.converter.toHttpRequest
import com.bitmovin.player.reactnative.converter.toHttpResponse
import com.bitmovin.player.reactnative.converter.toJson
import com.bitmovin.player.reactnative.converter.toNetworkConfig
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.jni.JavaScriptFunction
import expo.modules.kotlin.jni.JavaScriptValue
import expo.modules.kotlin.sharedobjects.SharedObject

class SharedNetworkConfig(
    appContext: AppContext,
    config: Map<String, Any?>,
    callback: JavaScriptFunction<JavaScriptValue>?,
) :
    SharedObject(appContext) {
    private val callbacks = CallbackScope(appContext, callback)
    val config = config.toNetworkConfig().apply {
        if (config.containsKey("preprocessHttpRequest")) {
            preprocessHttpRequestCallback = PreprocessHttpRequestCallback { type, request ->
                callbacks.future(
                    "preprocessHttpRequest",
                    listOf(type.toJson(), request.toJson()),
                    request,
                    fallbackArgument = 1,
                ) {
                    @Suppress("UNCHECKED_CAST")
                    (it as Map<String, Any?>).toHttpRequest()
                }
            }
        }
        if (config.containsKey("preprocessHttpResponse")) {
            preprocessHttpResponseCallback = PreprocessHttpResponseCallback { type, response ->
                callbacks.future(
                    "preprocessHttpResponse",
                    listOf(type.toJson(), response.toJson()),
                    response,
                    fallbackArgument = 1,
                ) {
                    @Suppress("UNCHECKED_CAST")
                    (it as Map<String, Any?>).toHttpResponse()
                }
            }
        }
    }
    fun destroy() = callbacks.close()
    override fun sharedObjectDidRelease() = destroy()
}
