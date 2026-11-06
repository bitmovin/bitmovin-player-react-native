package com.bitmovin.player.reactnative

import android.os.Handler
import android.os.Looper
import com.bitmovin.player.api.analytics.create
import com.bitmovin.player.api.source.Source
import com.bitmovin.player.reactnative.converter.toAnalyticsSourceMetadata
import com.bitmovin.player.reactnative.converter.toSourceConfig
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.exception.CodedException
import expo.modules.kotlin.sharedobjects.SharedObject
import java.util.concurrent.atomic.AtomicBoolean

/** Owns the source wrapper, without unloading a source retained by an SDK player. */
class SharedSource(appContext: AppContext) : SharedObject(appContext) {
    private var resource: Source? = null
    private val closed = AtomicBoolean(false)
    private val mainHandler = Handler(Looper.getMainLooper())
    val source: Source?
        get() = if (closed.get()) null else resource

    fun destroy() {
        if (!closed.compareAndSet(false, true)) return
        if (Looper.myLooper() == Looper.getMainLooper()) {
            resource = null
        } else {
            mainHandler.post { resource = null }
        }
    }

    override fun sharedObjectDidRelease() = destroy()

    fun initialize(
        drmNativeId: NativeId?,
        config: Map<String, Any>?,
        sourceRemoteControlConfig: Map<String, Any>?,
        analyticsSourceMetadata: Map<String, Any>?,
    ) {
        if (closed.get() || source != null) {
            return
        }

        val sourceConfig = config?.toSourceConfig()
            ?: throw SourceException.InvalidSourceConfig()

        // Get DRM config if provided
        sourceConfig.drmConfig = requireNotNull(appContext).registry.getModule<DrmModule>()?.getConfig(drmNativeId)

        val sourceMetadata = analyticsSourceMetadata?.toAnalyticsSourceMetadata()
        try {
            resource = if (sourceMetadata != null) {
                Source.create(sourceConfig, sourceMetadata)
            } else {
                Source.create(sourceConfig)
            }
            if (closed.get()) resource = null
        } catch (e: Exception) {
            throw SourceException.SourceCreationFailed(e.message ?: "Unknown error")
        }
    }
}

// MARK: - Exception Definitions

sealed class SourceException(message: String) : CodedException(message) {
    class InvalidSourceConfig : SourceException("Invalid source configuration")
    class SourceCreationFailed(reason: String) : SourceException("Could not create source: $reason")
}
