package com.bitmovin.player.reactnative

import com.bitmovin.player.api.ui.StyleConfig

/**
 * Wrapper for React Native style configuration.
 */
data class RNStyleConfigWrapper(
    val styleConfig: StyleConfig,
    val userInterfaceType: UserInterfaceType,
)
