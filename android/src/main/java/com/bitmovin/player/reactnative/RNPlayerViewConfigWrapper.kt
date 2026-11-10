package com.bitmovin.player.reactnative

import com.bitmovin.player.api.ui.PlayerViewConfig

/**
 * Wrapper for React Native player view configuration.
 */
data class RNPlayerViewConfigWrapper(
    val playerViewConfig: PlayerViewConfig,
    val pictureInPictureConfig: PictureInPictureConfig? = null,
)
