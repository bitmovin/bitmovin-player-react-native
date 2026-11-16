package com.bitmovin.player.reactnative

import expo.modules.kotlin.functions.Queues
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class PlaylistModule : Module() {
    override fun definition() = ModuleDefinition {
        Name("PlaylistModule")
        AsyncFunction("sources") { owner: SharedPlayer, known: List<SharedSource> ->
            owner.player.playlist.sources.map { source ->
                known.firstOrNull { it.source === source } ?: SharedSource(appContext, source)
            }
        }.runOnQueue(Queues.MAIN)
        AsyncFunction("add") { owner: SharedPlayer, peer: SharedSource, index: Int? ->
            val player = owner.player
            val source = peer.source
            if (index == null) player.playlist.add(source) else player.playlist.add(source, index)
        }.runOnQueue(Queues.MAIN)
        AsyncFunction("remove") { owner: SharedPlayer, peer: SharedSource ->
            val player = owner.player
            val source = peer.source
            val isInPlaylist = source in player.playlist.sources
            player.playlist.remove(source)
            isInPlaylist && source !in player.playlist.sources
        }.runOnQueue(Queues.MAIN)
        AsyncFunction("removeAt") { owner: SharedPlayer, index: Int ->
            val player = owner.player
            if (index in player.playlist.sources.indices) player.playlist.remove(index)
        }.runOnQueue(Queues.MAIN)
        AsyncFunction("seek") { owner: SharedPlayer, peer: SharedSource, time: Double ->
            owner.player.playlist.seek(peer.source, time)
        }.runOnQueue(Queues.MAIN)
    }
}
