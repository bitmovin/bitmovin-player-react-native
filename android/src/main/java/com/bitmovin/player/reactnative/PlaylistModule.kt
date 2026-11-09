package com.bitmovin.player.reactnative

import expo.modules.kotlin.functions.Queues
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class PlaylistModule : Module() {
    override fun definition() = ModuleDefinition {
        Name("PlaylistModule")

        AsyncFunction("sources") { nativeId: NativeId ->
            // A destroyed player has no playback session, for which native returns no sources.
            val sources = PlayerRegistry.getPlayer(nativeId)?.playlist?.sources.orEmpty()
            sources.mapNotNull { SourceRegistry.getNativeId(it) }
        }.runOnQueue(Queues.MAIN)

        AsyncFunction("add") { nativeId: NativeId, sourceNativeId: NativeId, index: Int? ->
            val player = PlayerRegistry.getPlayer(nativeId) ?: return@AsyncFunction
            val source = SourceRegistry.getSource(sourceNativeId)
                ?: throw SourceException.SourceNotInitialized(sourceNativeId)
            if (index == null) {
                player.playlist.add(source)
            } else {
                player.playlist.add(source, index)
            }
        }.runOnQueue(Queues.MAIN)

        AsyncFunction("remove") { nativeId: NativeId, sourceNativeId: NativeId ->
            val player = PlayerRegistry.getPlayer(nativeId) ?: return@AsyncFunction
            val source = SourceRegistry.getSource(sourceNativeId) ?: return@AsyncFunction
            player.playlist.remove(source)
        }.runOnQueue(Queues.MAIN)

        AsyncFunction("removeAt") { nativeId: NativeId, index: Int ->
            PlayerRegistry.getPlayer(nativeId)?.playlist?.remove(index)
        }.runOnQueue(Queues.MAIN)

        AsyncFunction("seek") { nativeId: NativeId, sourceNativeId: NativeId, time: Double ->
            val player = PlayerRegistry.getPlayer(nativeId) ?: return@AsyncFunction
            val source = SourceRegistry.getSource(sourceNativeId) ?: return@AsyncFunction
            player.playlist.seek(source, time)
        }.runOnQueue(Queues.MAIN)
    }
}
