package com.bitmovin.player.reactnative.converter

import com.bitmovin.player.api.network.NetworkConfig
import com.bitmovin.player.api.network.PreprocessHttpRequestCallback
import com.bitmovin.player.api.network.PreprocessHttpResponseCallback
import com.bitmovin.player.reactnative.CallbackScope

fun Map<String, Any?>.toNetworkConfig(callbacks: CallbackScope): NetworkConfig {
    val config = this
    return NetworkConfig().apply {
        if (config.containsKey("preprocessHttpRequest")) {
            preprocessHttpRequestCallback = PreprocessHttpRequestCallback { type, request ->
                callbacks.future(
                    "networkConfig.preprocessHttpRequest",
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
                    "networkConfig.preprocessHttpResponse",
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
}
