package com.bitmovin.player.reactnative

import com.bitmovin.player.api.Player

/**
 * Stable read-only interop API for optional companion packages that need to resolve
 * a native Bitmovin Player from a React Native Player.nativeId.
 */
object PlayerAccessor {
    @JvmStatic
    fun get(nativeId: NativeId): Player? = PlayerRegistry.getPlayer(nativeId)
}
