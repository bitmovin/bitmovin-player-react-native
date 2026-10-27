package com.bitmovin.player.reactnative

import com.bitmovin.player.api.source.Source
import com.bitmovin.player.reactnative.converter.toSeekTarget
import expo.modules.kotlin.functions.Queues
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class PlaylistModule : Module() {
    override fun definition() = ModuleDefinition {
        Name("PlaylistModule")

        AsyncFunction("sources") { nativeId: NativeId ->
            PlayerRegistry.getPlayer(nativeId)?.playlist?.sources?.mapNotNull { SourceRegistry.getNativeId(it) }
        }.runOnQueue(Queues.MAIN)

        AsyncFunction("add") { nativeId: NativeId, sourceNativeId: NativeId, index: Int? ->
            val player = PlayerRegistry.getPlayer(nativeId) ?: return@AsyncFunction false
            val source = SourceRegistry.getSource(sourceNativeId) ?: return@AsyncFunction false
            if (index == null) {
                player.playlist.add(source)
            } else {
                player.playlist.add(source, index)
            }
            // Native ignores the source without an active playback session or with an invalid index.
            source.isAttachedToPlayer
        }.runOnQueue(Queues.MAIN)

        AsyncFunction("remove") { nativeId: NativeId, sourceNativeId: NativeId ->
            val player = PlayerRegistry.getPlayer(nativeId) ?: return@AsyncFunction null
            val source = SourceRegistry.getSource(sourceNativeId) ?: return@AsyncFunction null
            player.playlist.remove(source)
            source.removedNativeId()
        }.runOnQueue(Queues.MAIN)

        AsyncFunction("removeAt") { nativeId: NativeId, index: Int ->
            val player = PlayerRegistry.getPlayer(nativeId) ?: return@AsyncFunction null
            val source = player.playlist.sources.getOrNull(index) ?: return@AsyncFunction null
            player.playlist.remove(index)
            source.removedNativeId()
        }.runOnQueue(Queues.MAIN)

        AsyncFunction("seek") { nativeId: NativeId, sourceNativeId: NativeId, time: Double ->
            val player = PlayerRegistry.getPlayer(nativeId) ?: return@AsyncFunction
            val source = SourceRegistry.getSource(sourceNativeId) ?: return@AsyncFunction
            player.playlist.seek(source, time)
        }.runOnQueue(Queues.MAIN)

        AsyncFunction("seekTo") { nativeId: NativeId, sourceNativeId: NativeId,
            seekTarget: Map<String, Any?>?, ->
            val player = PlayerRegistry.getPlayer(nativeId) ?: return@AsyncFunction
            val source = SourceRegistry.getSource(sourceNativeId) ?: return@AsyncFunction
            player.playlist.seek(source, seekTarget?.toSeekTarget())
        }.runOnQueue(Queues.MAIN)
    }
}

/**
 * The [NativeId] of this source if it was removed, i.e. is not attached to a player anymore.
 * The source is still registered here, as its release is posted.
 */
private fun Source.removedNativeId(): NativeId? = SourceRegistry.getNativeId(this).takeUnless { isAttachedToPlayer }
