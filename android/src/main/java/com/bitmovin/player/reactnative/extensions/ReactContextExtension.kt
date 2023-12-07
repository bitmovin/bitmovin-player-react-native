package com.bitmovin.player.reactnative.extensions

import com.bitmovin.player.reactnative.DrmModule
import com.bitmovin.player.reactnative.OfflineModule
import com.bitmovin.player.reactnative.PlayerModule
import com.bitmovin.player.reactnative.SourceModule
import com.bitmovin.player.reactnative.ui.CustomMessageHandlerModule
import com.bitmovin.player.reactnative.ui.FullscreenHandlerModule
import com.facebook.react.bridge.*
import com.facebook.react.uimanager.UIManagerModule

private inline fun <reified T : ReactContextBaseJavaModule> ReactContext.getModuleOrThrow(
    name: String,
): T = getNativeModule(T::class.java).throwIfNull(name)

private fun <T : ReactContextBaseJavaModule> T?.throwIfNull(name: String): T = this
    ?: throw IllegalStateException("${name}Module not found")

val ReactApplicationContext.playerModule: PlayerModule get() = getModuleOrThrow("Player")
val ReactApplicationContext.sourceModule: SourceModule get() = getModuleOrThrow("Source")
val ReactApplicationContext.offlineModule: OfflineModule get() = getModuleOrThrow("Offline")
val ReactApplicationContext.uiManagerModule: UIManagerModule get() = getModuleOrThrow("UIManager")
val ReactApplicationContext.drmModule: DrmModule get() = getModuleOrThrow("Drm")
val ReactApplicationContext.customMessageHandlerModule: CustomMessageHandlerModule
    get() = getModuleOrThrow("CustomMessageHandler")
val ReactApplicationContext.fullscreenHandlerModule: FullscreenHandlerModule
    get() = getModuleOrThrow("fullscreenHandler")
