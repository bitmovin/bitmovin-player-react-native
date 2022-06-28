package com.bitmovin.player.reactnative

import com.bitmovin.player.api.Player
import com.bitmovin.player.api.source.SourceConfig

/**
 * Object that holds a `Player`, its initial source configuration, and delays
 * the source loading until `Player` gets attached to a `PlayerView`.
 *
 * `Player.load()` cannot be called before the player gets attached
 * to a `PlayerView` otherwise events won't be sent and poster image won't load.
 * Therefore, this object aims to solve this problem by storing the last source the user
 * tried to load and actually loads it after the player gets attached to some `PlayerView`.
 */
class PlayerContext(val player: Player) {
    /**
     * Source configuration to be loaded when the player gets attached to a `PlayerView`.
     */
    var pendingSourceConfig: SourceConfig? = null
    /**
     * Flag signaling whether the player is currently attached to a view or not.
     */
    var isPlayerAttachedToView = false

    /**
     * Loads the source configuration as is or delay its execution until the player
     * gets attached to a `PlayerView` if it's not already.
     */
    fun load(config: SourceConfig) {
        if (!isPlayerAttachedToView) {
            pendingSourceConfig = config
        } else {
            player.load(config)
        }
    }

    /**
     * Loads the pending source configuration if it exists and toggle `isPlayerAttachedToView` flag.
     */
    fun loadPendingSource() {
        pendingSourceConfig?.let {
            if (!isPlayerAttachedToView) {
                player.load(it)
                isPlayerAttachedToView = true
            }
        }
    }
}