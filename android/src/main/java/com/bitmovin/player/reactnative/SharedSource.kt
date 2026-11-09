package com.bitmovin.player.reactnative

import com.bitmovin.player.api.analytics.create
import com.bitmovin.player.api.source.Source
import com.bitmovin.player.reactnative.converter.toAnalyticsSourceMetadata
import com.bitmovin.player.reactnative.converter.toSourceConfig
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.exception.CodedException
import expo.modules.kotlin.jni.JavaScriptFunction
import expo.modules.kotlin.jni.JavaScriptValue
import expo.modules.kotlin.sharedobjects.SharedRef

/** Owns the source wrapper, without unloading a source retained by an SDK player. */
class SharedSource(appContext: AppContext, source: Source, private val callbacks: CallbackScope) : SharedRef<Source>(
    source,
    appContext,
) {
    init { observeSourceEvents(source) }

    override fun sharedObjectDidRelease() = callbacks.close()

    val source: Source
        get() = ref

    companion object {
        fun create(
            appContext: AppContext,
            config: Map<String, Any>?,
            analyticsSourceMetadata: Map<String, Any>?,
            callback: JavaScriptFunction<JavaScriptValue>?,
        ): SharedSource {
            val callbacks = CallbackScope(appContext, callback)
            return callbacks.createSharedObject {
                val sourceConfig = config?.toSourceConfig(callbacks) ?: throw SourceException.InvalidSourceConfig()
                val source = analyticsSourceMetadata?.toAnalyticsSourceMetadata()?.let {
                    Source.create(sourceConfig, it)
                } ?: Source.create(sourceConfig)
                SharedSource(appContext, source, callbacks)
            }
        }
    }
}

sealed class SourceException(message: String) : CodedException(message) {
    class InvalidSourceConfig : SourceException("Invalid source configuration")
}
