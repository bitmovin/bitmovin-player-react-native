package com.bitmovin.player.reactnative.converter

import com.bitmovin.player.api.network.NetworkConfig
import com.bitmovin.player.api.network.PreprocessHttpRequestCallback
import com.bitmovin.player.api.network.PreprocessHttpResponseCallback
import com.bitmovin.player.reactnative.CallbackScope
import com.bitmovin.player.reactnative.extensions.withFunction

fun Map<String, Any?>.toNetworkConfig(callbacks: CallbackScope): NetworkConfig =
    NetworkConfig().apply {
        withFunction("preprocessHttpRequest") {
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
        withFunction("preprocessHttpResponse") {
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
