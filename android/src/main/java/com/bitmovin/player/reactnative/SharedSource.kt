package com.bitmovin.player.reactnative

import com.bitmovin.player.api.analytics.create
import com.bitmovin.player.api.source.Source
import com.bitmovin.player.reactnative.converter.toAnalyticsSourceMetadata
import com.bitmovin.player.reactnative.converter.toSourceConfig
import com.bitmovin.player.reactnative.converter.toWidevineConfig
import com.bitmovin.player.reactnative.extensions.getMap
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.jni.JavaScriptFunction
import expo.modules.kotlin.jni.JavaScriptValue
import expo.modules.kotlin.sharedobjects.SharedRef

/** Owns the source wrapper, without unloading a source retained by an SDK player. */
class SharedSource(appContext: AppContext, source: Source, private val callbacks: CallbackScope) : SharedRef<Source>(
    source,
    appContext,
) {
    fun closeCallbacks() = callbacks.close()
    override fun sharedObjectDidRelease() = closeCallbacks()

    val source: Source
        get() = ref

    companion object {
        fun create(
            appContext: AppContext,
            config: Map<String, Any>?,
            analyticsSourceMetadata: Map<String, Any>?,
            callback: JavaScriptFunction<JavaScriptValue>?,
        ): SharedSource {
            val sourceConfig = config?.toSourceConfig() ?: throw SourceException.InvalidSourceConfig()
            val callbacks = CallbackScope(appContext, callback)
            try {
                sourceConfig.drmConfig = config.getMap("drmConfig")?.toWidevineConfig(callbacks, "drmConfig")
                val source = analyticsSourceMetadata?.toAnalyticsSourceMetadata()?.let {
                    Source.create(sourceConfig, it)
                } ?: Source.create(sourceConfig)
                return SharedSource(appContext, source, callbacks)
            } catch (error: Exception) {
                callbacks.close()
                throw error
            }
        }
    }
}
