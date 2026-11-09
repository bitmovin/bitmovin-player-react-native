package com.bitmovin.player.reactnative

/**
 * Configuration wrapper for Picture-in-Picture functionality.
 */
data class PictureInPictureConfig(
    val isEnabled: Boolean = false,
    val shouldEnterOnBackground: Boolean = false,
)
