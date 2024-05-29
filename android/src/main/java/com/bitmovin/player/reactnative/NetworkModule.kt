package com.bitmovin.player.reactnative

import com.bitmovin.player.api.network.HttpRequestType
import com.bitmovin.player.api.network.HttpResponse
import com.bitmovin.player.api.network.NetworkConfig
import com.bitmovin.player.api.network.PreprocessHttpResponseCallback
import com.bitmovin.player.reactnative.converter.toJson
import com.bitmovin.player.reactnative.converter.toNetworkConfig
import com.facebook.react.bridge.*
import com.facebook.react.module.annotations.ReactModule
import java.security.InvalidParameterException
import java.util.concurrent.Future

private const val MODULE_NAME = "NetworkModule"

@ReactModule(name = MODULE_NAME)
class NetworkModule(context: ReactApplicationContext) : BitmovinBaseModule(context) {
    /**
     * In-memory mapping from `nativeId`s to `NetworkConfig` instances.
     */
    private val networkConfigs: Registry<NetworkConfig> = mutableMapOf()

    override fun getName() = MODULE_NAME

    fun getConfig(nativeId: NativeId?): NetworkConfig? {
        if (nativeId == null) {
            return null
        }
        return networkConfigs[nativeId]
    }

    @ReactMethod
    fun initWithConfig(nativeId: NativeId, config: ReadableMap, promise: Promise) {
        promise.unit.resolveOnUiThread {
            if (networkConfigs.containsKey(nativeId)) {
                throw InvalidParameterException("NativeId already exists $nativeId")
            }
            val networkConfig = config.toNetworkConfig()
            networkConfigs[nativeId] = networkConfig
            initConfigBlocks(nativeId, config)
        }
    }

    /**
     * Removes the `WidevineConfig` instance associated with `nativeId` from the internal drmConfigs.
     * @param nativeId `WidevineConfig` to be disposed.
     */
    @ReactMethod
    fun destroy(nativeId: NativeId) {
        networkConfigs.remove(nativeId)
    }

    private fun initConfigBlocks(nativeId: String, config: Any?) {
        (config as? Map<String, Any>)?.let { json ->
            initPreprocessHttpResponse(nativeId, networkConfigJson = json)
        }
    }

    private fun initPreprocessHttpResponse(nativeId: NativeId, networkConfigJson: Map<String, Any>) {
        val networkConfig = getConfig(nativeId) ?: return
        if (networkConfigJson["preprocessHttpResponse"] != null) {
            networkConfig.preprocessHttpResponseCallback = PreprocessHttpResponseCallback {
                    type, response ->
                preprocessHttpResponseFromJS(nativeId, type, response)
            }
        }
    }

    private fun preprocessHttpResponseFromJS(
        nativeId: NativeId,
        type: HttpRequestType,
        response: HttpResponse,
    ): Future<HttpResponse> {
        val responseId = "$nativeId@${System.identityHashCode(response)}"
        val method = "onPreprocessHttpResponse"

        val args = Arguments.createArray()
        args.pushString(responseId)
        args.pushString(type.toJson())
        args.pushMap(response.toJson())

        context.catalystInstance.callFunction("Network-$nativeId", method, args as NativeArray)
    }
}