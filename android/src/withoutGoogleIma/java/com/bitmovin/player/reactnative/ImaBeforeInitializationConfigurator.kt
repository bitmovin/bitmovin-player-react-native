package com.bitmovin.player.reactnative

import com.bitmovin.player.api.PlayerConfig

internal object ImaBeforeInitializationConfigurator {
    const val IS_GOOGLE_IMA_ENABLED = false

    @Suppress("UNUSED_PARAMETER")
    fun configure(config: Map<String, Any?>?, playerConfig: PlayerConfig, callbacks: CallbackScope) = Unit
}
