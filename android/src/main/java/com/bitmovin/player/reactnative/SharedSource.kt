package com.bitmovin.player.reactnative

import com.bitmovin.player.api.analytics.create
import com.bitmovin.player.api.source.Source
import com.bitmovin.player.reactnative.converter.toAnalyticsSourceMetadata
import com.bitmovin.player.reactnative.converter.toSourceConfig
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.jni.JavaScriptObject
import expo.modules.kotlin.sharedobjects.SharedObject

/** Owns the source wrapper, without unloading a source retained by an SDK player. */
class SharedSource private constructor(
    appContext: AppContext,
    factory: () -> Source,
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

    companion object {
        fun create(
            appContext: AppContext,
            config: JavaScriptObject?,
            analyticsSourceMetadata: Map<String, Any>?,
        ): SharedSource {
            val nativeConfig = config?.toNativeConfig()
            return SharedSource(appContext) {
                val sourceConfig = nativeConfig?.toSourceConfig(appContext)
                    ?: throw InvalidRnArgumentException("Invalid source configuration")
                val source = analyticsSourceMetadata?.toAnalyticsSourceMetadata()?.let {
                    Source.create(sourceConfig, it)
                } ?: Source.create(sourceConfig)
                source
            }
        }

        private fun snapshot(source: Source): Map<String, Any?> = with(source.config) {
            mapOf(
                "url" to url,
                "type" to type.name.lowercase(),
                "title" to title,
                "description" to description,
                "metadata" to metadata,
            )
        }
    }
}
