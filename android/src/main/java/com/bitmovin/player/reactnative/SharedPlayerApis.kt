package com.bitmovin.player.reactnative

import expo.modules.kotlin.sharedobjects.SharedObject

/** API handles share SDK readiness and keep their native owner alive. */
open class SharedPlayerApi(val owner: SharedPlayer) : SharedObject(checkNotNull(owner.appContext)) {
    val player get() = owner.player
    val mediaSessionPlaybackManager get() = owner.mediaSessionPlaybackManager
}
class SharedBuffer(owner: SharedPlayer) : SharedPlayerApi(owner)
class SharedAnalytics(owner: SharedPlayer) : SharedPlayerApi(owner)
class SharedPlaylist(owner: SharedPlayer) : SharedPlayerApi(owner)
