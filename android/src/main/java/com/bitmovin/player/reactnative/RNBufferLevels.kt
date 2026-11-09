package com.bitmovin.player.reactnative

import com.bitmovin.player.api.buffer.BufferLevel

/**
 * Data class for buffer levels - used for exposing buffer information.
 */
data class RNBufferLevels(
    val audio: BufferLevel,
    val video: BufferLevel,
)
