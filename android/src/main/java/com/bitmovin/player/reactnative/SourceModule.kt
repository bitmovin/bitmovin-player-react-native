package com.bitmovin.player.reactnative

import com.bitmovin.player.reactnative.converter.toJson
import expo.modules.kotlin.functions.Queues
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class SourceModule : Module() {
    override fun definition() = ModuleDefinition {
        Name("SourceModule")
        AsyncFunction("create") { config: Map<String, Any>?, drm: SharedDrm?,
            remoteControl: Map<String, Any>?, analytics: Map<String, Any>?, ->
            SharedSource.create(appContext, config, drm, remoteControl, analytics)
        }.runOnQueue(Queues.MAIN)

        Class(SharedSource::class) {
            AsyncFunction("isAttachedToPlayer") { shared: SharedSource ->
                shared.source.isAttachedToPlayer
            }.runOnQueue(Queues.MAIN)

            AsyncFunction("isActive") { shared: SharedSource ->
                shared.source.isActive
            }.runOnQueue(Queues.MAIN)

            AsyncFunction("duration") { shared: SharedSource ->
                shared.source.duration
            }.runOnQueue(Queues.MAIN)

            AsyncFunction("loadingState") { shared: SharedSource ->
                shared.source.loadingState.toJson()
            }.runOnQueue(Queues.MAIN)

            AsyncFunction("getMetadata") { shared: SharedSource ->
                shared.source.config.metadata
            }.runOnQueue(Queues.MAIN)

            AsyncFunction("setMetadata") { shared: SharedSource, metadata: Map<String, Any>? ->
                shared.source.config.metadata = metadata?.mapValues { it.value.toString() }
            }.runOnQueue(Queues.MAIN)

            AsyncFunction("getThumbnail") { shared: SharedSource, time: Double ->
                shared.source.getThumbnail(time)?.toJson()
            }.runOnQueue(Queues.MAIN)
        }
    }
}
