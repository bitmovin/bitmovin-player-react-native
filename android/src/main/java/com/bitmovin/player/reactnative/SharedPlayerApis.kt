package com.bitmovin.player.reactnative

import expo.modules.kotlin.sharedobjects.SharedObject

/** API handles share SDK readiness and keep their native owner alive. */
open class SharedPlayerApi(val owner: SharedPlayer) : SharedObject(checkNotNull(owner.appContext)) {
    val player get() = owner.player
    val mediaSessionPlaybackManager get() = owner.mediaSessionPlaybackManager
}
class SharedBufferApi(owner: SharedPlayer) : SharedPlayerApi(owner)
class SharedAnalyticsApi(owner: SharedPlayer) : SharedPlayerApi(owner)
class SharedPlaylistApi(owner: SharedPlayer) : SharedPlayerApi(owner)
