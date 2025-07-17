package com.bitmovin.player.reactnative

import android.util.Log
import androidx.concurrent.futures.CallbackToFutureAdapter
import androidx.concurrent.futures.CallbackToFutureAdapter.Completer
import androidx.core.os.bundleOf
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
import expo.modules.kotlin.Promise
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import java.util.concurrent.ConcurrentHashMap
import java.util.concurrent.Future

/**
 * Expo module for NetworkConfig management with HTTP request/response preprocessing.
 * Handles bidirectional communication between native code and JavaScript for network operations.
 */
class NetworkModule : Module() {
    /**
     * In-memory mapping from `nativeId`s to `NetworkConfig` instances.
     */
    private val networkConfigs: Registry<NetworkConfig> = mutableMapOf()
    private val preprocessHttpRequestCompleters = ConcurrentHashMap<String, Completer<HttpRequest>>()
    private val preprocessHttpResponseCompleters = ConcurrentHashMap<String, Completer<HttpResponse>>()

    override fun definition() = ModuleDefinition {
        Name("NetworkModule")

        Events("onPreprocessHttpRequest", "onPreprocessHttpResponse")

        AsyncFunction("initializeWithConfig") { nativeId: String, config: Map<String, Any?>, promise: Promise ->
            if (networkConfigs.containsKey(nativeId)) {
                promise.resolve(null)
                return@AsyncFunction
            }

            try {
                val networkConfig = config.toNetworkConfig()
                networkConfigs[nativeId] = networkConfig
                initConfigBlocks(nativeId, config)
                promise.resolve(null)
            } catch (e: Exception) {
                promise.reject("NetworkError", "Failed to initialize network config", e)
            }
        }

        AsyncFunction("destroy") { nativeId: String ->
            networkConfigs.remove(nativeId)

            // Clean up completion handlers
            preprocessHttpRequestCompleters.keys.filter { it.startsWith(nativeId) }.forEach {
                preprocessHttpRequestCompleters.remove(it)
            }
            preprocessHttpResponseCompleters.keys.filter { it.startsWith(nativeId) }.forEach {
                preprocessHttpResponseCompleters.remove(it)
            }
        }

        AsyncFunction("setPreprocessedHttpRequest") { requestId: String, request: Map<String, Any?> ->
            val completer = preprocessHttpRequestCompleters.remove(requestId)
            if (completer == null) {
                Log.e("NetworkModule", "Completer is null for requestId: $requestId, this can cause stuck network requests")
                return@AsyncFunction
            }
            completer.set(request.toHttpRequest())
        }

        AsyncFunction("setPreprocessedHttpResponse") { responseId: String, response: Map<String, Any?> ->
            preprocessHttpResponseCompleters[responseId]?.set(response.toHttpResponse())
            preprocessHttpResponseCompleters.remove(responseId)
        }
    }

    /**
     * Retrieves the NetworkConfig instance for the given nativeId.
     * This method maintains the same static access pattern as the legacy module.
     */
    fun getConfig(nativeId: String?): NetworkConfig? = nativeId?.let { networkConfigs[it] }

    private fun initConfigBlocks(nativeId: String, config: Map<String, Any?>) {
        initPreprocessHttpRequest(nativeId, config)
        initPreprocessHttpResponse(nativeId, config)
    }

    private fun initPreprocessHttpRequest(nativeId: String, networkConfigJson: Map<String, Any?>) {
        val networkConfig = getConfig(nativeId) ?: return
        if (!networkConfigJson.containsKey("preprocessHttpRequest")) return

        networkConfig.preprocessHttpRequestCallback = PreprocessHttpRequestCallback { type, request ->
            preprocessHttpRequestFromJS(nativeId, type, request)
        }
    }

    private fun initPreprocessHttpResponse(nativeId: String, networkConfigJson: Map<String, Any?>) {
        val networkConfig = getConfig(nativeId) ?: return
        if (!networkConfigJson.containsKey("preprocessHttpResponse")) return

        networkConfig.preprocessHttpResponseCallback = PreprocessHttpResponseCallback { type, response ->
            preprocessHttpResponseFromJS(nativeId, type, response)
        }
    }

    private fun preprocessHttpRequestFromJS(
        nativeId: String,
        type: HttpRequestType,
        request: HttpRequest,
    ): Future<HttpRequest> {
        val requestId = "$nativeId@${System.identityHashCode(request)}"
        val args = mapOf(
            "requestId" to requestId,
            "type" to type.toJson(),
            "request" to request.toJson(),
        )

        return CallbackToFutureAdapter.getFuture { completer ->
            preprocessHttpRequestCompleters[requestId] = completer

            // Send event to TypeScript using Expo module event system
            sendEvent(
                "onPreprocessHttpRequest",
                bundleOf(
                    "nativeId" to nativeId,
                    "requestId" to requestId,
                    "type" to type.toJson(),
                    "request" to request.toJson(),
                ),
            )

            return@getFuture "NetworkModule-preprocessHttpRequest-$requestId"
        }
    }

    private fun preprocessHttpResponseFromJS(
        nativeId: String,
        type: HttpRequestType,
        response: HttpResponse,
    ): Future<HttpResponse> {
        val responseId = "$nativeId@${System.identityHashCode(response)}"

        return CallbackToFutureAdapter.getFuture { completer ->
            preprocessHttpResponseCompleters[responseId] = completer

            // Send event to TypeScript using Expo module event system
            sendEvent(
                "onPreprocessHttpResponse",
                bundleOf(
                    "nativeId" to nativeId,
                    "responseId" to responseId,
                    "type" to type.toJson(),
                    "response" to response.toJson(),
                ),
            )

            return@getFuture "NetworkModule-preprocessHttpResponse-$responseId"
        }
    }
}
