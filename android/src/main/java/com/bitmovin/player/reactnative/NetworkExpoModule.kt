package com.bitmovin.player.reactnative

import android.util.Log
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
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.bridge.NativeArray
import com.facebook.react.common.MapBuilder
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import expo.modules.kotlin.Promise
import java.util.concurrent.ConcurrentHashMap
import java.util.concurrent.Future

private const val MODULE_NAME = "NetworkExpoModule"

/**
 * Expo module for NetworkConfig management with HTTP request/response preprocessing.
 * Handles bidirectional communication between native code and JavaScript for network operations.
 */
class NetworkExpoModule : Module() {
    /**
     * In-memory mapping from `nativeId`s to `NetworkConfig` instances.
     */
    private val networkConfigs: Registry<NetworkConfig> = mutableMapOf()
    private val preprocessHttpRequestCompleters = ConcurrentHashMap<String, Completer<HttpRequest>>()
    private val preprocessHttpResponseCompleters = ConcurrentHashMap<String, Completer<HttpResponse>>()

    override fun definition() = ModuleDefinition {
        Name(MODULE_NAME)

        AsyncFunction("initWithConfig") { nativeId: String, config: Map<String, Any?>, promise: Promise ->
            if (networkConfigs.containsKey(nativeId)) {
                promise.resolve(null)
                return@AsyncFunction
            }
            
            try {
                val readableMap = convertMapToReadableMap(config)
                val networkConfig = readableMap.toNetworkConfig()
                networkConfigs[nativeId] = networkConfig
                initConfigBlocks(nativeId, readableMap)
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
                Log.e(MODULE_NAME, "Completer is null for requestId: $requestId, this can cause stuck network requests")
                return@AsyncFunction
            }
            val readableMap = convertMapToReadableMap(request)
            completer.set(readableMap.toHttpRequest())
        }

        AsyncFunction("setPreprocessedHttpResponse") { responseId: String, response: Map<String, Any?> ->
            val readableMap = convertMapToReadableMap(response)
            preprocessHttpResponseCompleters[responseId]?.set(readableMap.toHttpResponse())
            preprocessHttpResponseCompleters.remove(responseId)
        }
    }

    /**
     * Retrieves the NetworkConfig instance for the given nativeId.
     * This method maintains the same static access pattern as the legacy module.
     */
    fun getConfig(nativeId: String?): NetworkConfig? = nativeId?.let { networkConfigs[it] }

    private fun initConfigBlocks(nativeId: String, config: ReadableMap) {
        initPreprocessHttpRequest(nativeId, config)
        initPreprocessHttpResponse(nativeId, config)
    }

    private fun initPreprocessHttpRequest(nativeId: String, networkConfigJson: ReadableMap) {
        val networkConfig = getConfig(nativeId) ?: return
        if (!networkConfigJson.hasKey("preprocessHttpRequest")) return
        
        networkConfig.preprocessHttpRequestCallback = PreprocessHttpRequestCallback { type, request ->
            preprocessHttpRequestFromJS(nativeId, type, request)
        }
    }

    private fun initPreprocessHttpResponse(nativeId: String, networkConfigJson: ReadableMap) {
        val networkConfig = getConfig(nativeId) ?: return
        if (!networkConfigJson.hasKey("preprocessHttpResponse")) return
        
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
            "request" to request.toJson()
        )

        return CallbackToFutureAdapter.getFuture { completer ->
            preprocessHttpRequestCompleters[requestId] = completer
            
            // Call JavaScript function directly using React Native bridge
            // This maintains the same bidirectional communication pattern as the legacy module
            appContext.reactContext?.let { context ->
                val args = Arguments.createArray()
                args.pushString(requestId)
                args.pushString(type.toJson())
                args.pushMap(request.toJson())
                (context as ReactApplicationContext).catalystInstance.callFunction("Network-$nativeId", "onPreprocessHttpRequest", args as NativeArray)
            }
            
            return@getFuture "NetworkExpoModule-preprocessHttpRequest-$requestId"
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
            
            // Call JavaScript function directly using React Native bridge
            appContext.reactContext?.let { context ->
                val args = Arguments.createArray()
                args.pushString(responseId)
                args.pushString(type.toJson())
                args.pushMap(response.toJson())
                (context as ReactApplicationContext).catalystInstance.callFunction("Network-$nativeId", "onPreprocessHttpResponse", args as NativeArray)
            }
            
            return@getFuture "NetworkExpoModule-preprocessHttpResponse-$responseId"
        }
    }

    /**
     * Converts a Map<String, Any?> to ReadableMap for compatibility with legacy converter methods.
     */
    private fun convertMapToReadableMap(map: Map<String, Any?>): ReadableMap {
        val writableMap = Arguments.createMap()
        map.forEach { (key, value) ->
            when (value) {
                is String -> writableMap.putString(key, value)
                is Int -> writableMap.putInt(key, value)
                is Double -> writableMap.putDouble(key, value)
                is Boolean -> writableMap.putBoolean(key, value)
                is Map<*, *> -> writableMap.putMap(key, convertMapToReadableMap(value as Map<String, Any?>))
                is List<*> -> {
                    val array = Arguments.createArray()
                    value.forEach { item ->
                        when (item) {
                            is String -> array.pushString(item)
                            is Int -> array.pushInt(item)
                            is Double -> array.pushDouble(item)
                            is Boolean -> array.pushBoolean(item)
                            is Map<*, *> -> array.pushMap(convertMapToReadableMap(item as Map<String, Any?>))
                        }
                    }
                    writableMap.putArray(key, array)
                }
                null -> writableMap.putNull(key)
            }
        }
        return writableMap
    }

    companion object {
        /**
         * Static access method to maintain compatibility with other modules.
         * Retrieves the NetworkConfig for the given nativeId from any NetworkExpoModule instance.
         */
        @JvmStatic
        fun getNetworkConfig(nativeId: String): NetworkConfig? {
            // This static access pattern maintains compatibility with existing code
            // In a production implementation, we would need to maintain a global registry
            // or use dependency injection to access the module instance
            return null // TODO: Implement global registry pattern if needed
        }
    }
}