package com.bitmovin.player.reactnative

import com.bitmovin.player.api.analytics.create
import com.bitmovin.player.api.source.Source
import com.bitmovin.player.reactnative.converter.toAnalyticsSourceMetadata
import com.bitmovin.player.reactnative.converter.toSourceConfig
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.exception.CodedException
import expo.modules.kotlin.sharedobjects.SharedRef

/** Owns the source wrapper, without unloading a source retained by an SDK player. */
class SharedSource(appContext: AppContext, source: Source) : SharedRef<Source>(source, appContext) {
    val source: Source
        get() = ref

    companion object {
        fun create(
            appContext: AppContext,
            config: Map<String, Any>?,
            drm: SharedDrmConfig?,
            analyticsSourceMetadata: Map<String, Any>?,
        ): SharedSource {
            val sourceConfig = config?.toSourceConfig() ?: throw SourceException.InvalidSourceConfig()
            sourceConfig.drmConfig = drm?.config
            try {
                val source = analyticsSourceMetadata?.toAnalyticsSourceMetadata()?.let {
                    Source.create(sourceConfig, it)
                } ?: Source.create(sourceConfig)
                return SharedSource(appContext, source)
            } catch (error: Exception) {
                throw SourceException.SourceCreationFailed(error.message ?: "Unknown error")
            }
        }
    }
}

sealed class SourceException(message: String) : CodedException(message) {
    class InvalidSourceConfig : SourceException("Invalid source configuration")
    class SourceCreationFailed(reason: String) : SourceException("Could not create source: $reason")
}
