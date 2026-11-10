package com.bitmovin.player.reactnative

import com.bitmovin.player.api.Player
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.sharedobjects.SharedRef

/** Shared handle used by migrated APIs while PlayerModule still controls its lifecycle. */
class SharedPlayer(appContext: AppContext, player: Player) : SharedRef<Player>(player, appContext) {
    val player: Player
        get() = ref
}
