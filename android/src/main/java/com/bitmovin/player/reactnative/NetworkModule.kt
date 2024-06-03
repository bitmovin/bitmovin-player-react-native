package com.bitmovin.player.reactnative

import androidx.concurrent.futures.CallbackToFutureAdapter
import androidx.concurrent.futures.CallbackToFutureAdapter.Completer
import com.bitmovin.player.api.network.HttpRequest
import com.bitmovin.player.api.network.HttpRequestType
import com.bitmovin.player.api.network.HttpResponse
import com.bitmovin.player.api.network.NetworkConfig
import com.bitmovin.player.api.network.PreprocessHttpRequestCallback
import com.bitmovin.player.api.network.PreprocessHttpResponseCallback
import com.bitmovin.player.reactnative.converter.toHttpRequest
import com.bitmovin.player.reactnative.converter.toHttpResponse
import com.bitmovin.player.reactnative.converter.toJson
import com.bitmovin.player.reactnative.converter.toNetworkConfig
import com.facebook.react.bridge.*
import com.facebook.react.module.annotations.ReactModule
import java.util.concurrent.Future

private const val MODULE_NAME = "NetworkModule"

@ReactModule(name = MODULE_NAME)
class NetworkModule(context: ReactApplicationContext) : BitmovinBaseModule(context) {

    /**
     * In-memory mapping from `nativeId`s to `NetworkConfig` instances.
     */
    private val networkConfigs: Registry<NetworkConfig> = mutableMapOf()
    private val preprocessHttpRequestCompleters: MutableMap<String, Completer<HttpRequest>> = mutableMapOf()
    private val preprocessHttpResponseCompleters: MutableMap<String, Completer<HttpResponse>> = mutableMapOf()
    override fun getName() = MODULE_NAME

    fun getConfig(nativeId: NativeId?): NetworkConfig? = nativeId?.let { networkConfigs[it] }

    @ReactMethod
    fun initWithConfig(nativeId: NativeId, config: ReadableMap, promise: Promise) {
        promise.unit.resolveOnUiThread {
            if (networkConfigs.containsKey(nativeId)) {
                return@resolveOnUiThread
            }
            val networkConfig = config.toNetworkConfig()
            networkConfigs[nativeId] = networkConfig
            initConfigBlocks(nativeId, config)
        }
    }

    @ReactMethod
    fun destroy(nativeId: NativeId) {
        networkConfigs.remove(nativeId)
        preprocessHttpRequestCompleters.keys.filter { it.startsWith(nativeId) }.forEach {
            preprocessHttpRequestCompleters.remove(it)
        }
        preprocessHttpResponseCompleters.keys.filter { it.startsWith(nativeId) }.forEach {
            preprocessHttpResponseCompleters.remove(it)
        }
    }

    private fun initConfigBlocks(nativeId: String, config: ReadableMap) {
        initPreprocessHttpRequest(nativeId, networkConfigJson = config)
        initPreprocessHttpResponse(nativeId, networkConfigJson = config)
    }

    private fun initPreprocessHttpRequest(nativeId: NativeId, networkConfigJson: ReadableMap) {
        val networkConfig = getConfig(nativeId) ?: return
        if (!networkConfigJson.hasKey("preprocessHttpRequest")) return
        networkConfig.preprocessHttpRequestCallback = PreprocessHttpRequestCallback { type, request ->
            preprocessHttpRequestFromJS(nativeId, type, request)
        }
    }

    private fun initPreprocessHttpResponse(nativeId: NativeId, networkConfigJson: ReadableMap) {
        val networkConfig = getConfig(nativeId) ?: return
        if (!networkConfigJson.hasKey("preprocessHttpResponse")) return
        networkConfig.preprocessHttpResponseCallback = PreprocessHttpResponseCallback { type, response ->
            preprocessHttpResponseFromJS(nativeId, type, response)
        }
    }

    private fun preprocessHttpRequestFromJS(
        nativeId: NativeId,
        type: HttpRequestType,
        request: HttpRequest,
    ): Future<HttpRequest> {
        val requestId = "$nativeId@${System.identityHashCode(request)}"
        val args = Arguments.createArray()
        args.pushString(requestId)
        args.pushString(type.toJson())
        args.pushMap(request.toJson())

        return CallbackToFutureAdapter.getFuture { completer ->
            preprocessHttpRequestCompleters[requestId] = completer
            context.catalystInstance.callFunction("Network-$nativeId", "onPreprocessHttpRequest", args as NativeArray)
        }
    }

    @ReactMethod
    fun setPreprocessedHttpRequest(requestId: String, response: ReadableMap) {
        preprocessHttpRequestCompleters[requestId]?.set(response.toHttpRequest())
        preprocessHttpRequestCompleters.remove(requestId)
    }

    private fun preprocessHttpResponseFromJS(
        nativeId: NativeId,
        type: HttpRequestType,
        response: HttpResponse,
    ): Future<HttpResponse> {
        val responseId = "$nativeId@${System.identityHashCode(response)}"
        val args = Arguments.createArray()
        args.pushString(responseId)
        args.pushString(type.toJson())
        args.pushMap(response.toJson())

        return CallbackToFutureAdapter.getFuture { completer ->
            preprocessHttpResponseCompleters[responseId] = completer
            context.catalystInstance.callFunction("Network-$nativeId", "onPreprocessHttpResponse", args as NativeArray)
        }
    }

    @ReactMethod
    fun setPreprocessedHttpResponse(responseId: String, response: ReadableMap) {
        preprocessHttpResponseCompleters[responseId]?.set(response.toHttpResponse())
        preprocessHttpResponseCompleters.remove(responseId)
    }
}
