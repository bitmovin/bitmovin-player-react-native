package com.bitmovin.player.reactnative

/**
 * React Native view and Android system Picture-in-Picture flags.
 * These are separate from the SDK PlayerViewConfig.
 */
data class PictureInPictureConfig(
    val isEnabled: Boolean = false,
    val shouldEnterOnBackground: Boolean = false,
)
