package com.bitmovin.player.reactnative.extensions

import com.bitmovin.player.reactnative.DrmModule
import com.bitmovin.player.reactnative.OfflineModule
import com.bitmovin.player.reactnative.PlayerModule
import com.bitmovin.player.reactnative.SourceModule
import com.bitmovin.player.reactnative.ui.CustomMessageHandlerModule
import com.facebook.react.bridge.*
import com.facebook.react.uimanager.UIManagerModule

inline fun <reified T : ReactContextBaseJavaModule> ReactContext.getModule(): T? {
    return getNativeModule(T::class.java)
}

val ReactApplicationContext.playerModule get() = getModule<PlayerModule>()
val ReactApplicationContext.sourceModule get() = getModule<SourceModule>()
val ReactApplicationContext.offlineModule get() = getModule<OfflineModule>()
val ReactApplicationContext.uiManagerModule get() = getModule<UIManagerModule>()
val ReactApplicationContext.drmModule get() = getModule<DrmModule>()
val ReactApplicationContext.customMessageHandlerModule get() = getModule<CustomMessageHandlerModule>()
