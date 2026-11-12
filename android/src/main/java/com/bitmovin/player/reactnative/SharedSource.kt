package com.bitmovin.player.reactnative

import com.bitmovin.player.api.analytics.create
import com.bitmovin.player.api.source.Source
import com.bitmovin.player.reactnative.converter.toAnalyticsSourceMetadata
import com.bitmovin.player.reactnative.converter.toSourceConfig
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.exception.CodedException
import expo.modules.kotlin.jni.JavaScriptFunction
import expo.modules.kotlin.jni.JavaScriptValue
import expo.modules.kotlin.sharedobjects.SharedObject

/** Owns the source wrapper, without unloading a source retained by an SDK player. */
class SharedSource private constructor(
    appContext: AppContext,
    factory: () -> Source,
    private val callbacks: CallbackScope? = null,
) : SharedObject(appContext) {
    constructor(appContext: AppContext, source: Source) : this(appContext, { source }) {
        // SDK-created offline sources must already emit events when the JS query resolves.
        this.source
    }

    val source: Source by lazy {
        factory().also { source ->
            observeSourceEvents(source)
            configSnapshot = snapshot(source)
        }
    }
    var configSnapshot: Map<String, Any?>? = null
        private set

    override fun sharedObjectDidRelease() { callbacks?.close() }

    companion object {
        fun create(
            appContext: AppContext,
            config: Map<String, Any>?,
            analyticsSourceMetadata: Map<String, Any>?,
            callback: JavaScriptFunction<JavaScriptValue>?,
        ): SharedSource {
            val callbacks = CallbackScope(appContext, callback)
            return SharedSource(appContext, {
                val sourceConfig = config?.toSourceConfig(callbacks) ?: throw CodedException("ERR_INVALID_ARGUMENT", "Invalid source configuration", null)
                val source = analyticsSourceMetadata?.toAnalyticsSourceMetadata()?.let {
                    Source.create(sourceConfig, it)
                } ?: Source.create(sourceConfig)
                source
            }, callbacks)
        }

        private fun snapshot(source: Source): Map<String, Any?> = with(source.config) {
            mapOf("url" to url, "type" to type.name.lowercase(), "title" to title,
                "description" to description, "metadata" to metadata)
        }
    }
}
