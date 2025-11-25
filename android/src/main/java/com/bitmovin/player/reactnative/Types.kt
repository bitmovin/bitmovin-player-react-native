package com.bitmovin.player.reactnative

import com.bitmovin.player.api.buffer.BufferLevel
import com.bitmovin.player.api.ui.PlayerViewConfig
import com.bitmovin.player.api.ui.StyleConfig

/**
 * Represents the user interface type for the React Native player.
 */
enum class UserInterfaceType {
    Subtitle,
    Bitmovin,
}

/**
 * Configuration wrapper for Picture-in-Picture functionality.
 */
data class PictureInPictureConfig(
    val isEnabled: Boolean = false,
    val shouldEnterOnBackground: Boolean = true,
)

/**
 * Wrapper for React Native player view configuration.
 */
data class RNPlayerViewConfigWrapper(
    val playerViewConfig: PlayerViewConfig,
    val pictureInPictureConfig: PictureInPictureConfig? = null,
)

/**
 * Wrapper for React Native style configuration.
 */
data class RNStyleConfigWrapper(
    val styleConfig: StyleConfig,
    val userInterfaceType: UserInterfaceType,
)

/**
 * Data class for buffer levels - used for exposing buffer information.
 */
data class RNBufferLevels(
    val audio: BufferLevel,
    val video: BufferLevel,
)
