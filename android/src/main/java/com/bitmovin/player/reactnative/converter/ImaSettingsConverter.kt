package com.bitmovin.player.reactnative.converter

import com.bitmovin.player.reactnative.extensions.withInt
import com.bitmovin.player.reactnative.extensions.withString
import com.google.ads.interactivemedia.v3.api.ImaSdkSettings

fun ImaSdkSettings.toMap(): Map<String, Any?> =
    mutableMapOf<String, Any?>().apply {
        put("ppid", ppid)
        put("language", language)
        put("maxRedirects", maxRedirects)
        put("playerVersion", playerVersion)
        put("sessionId", sessionId)
    }

fun Map<String, Any?>.applyOnImaSettings(settings: ImaSdkSettings) {
    withString("ppid") { settings.ppid = it }
    withString("language") { settings.language = it }
    withInt("maxRedirects") { settings.maxRedirects = it }
    withString("playerVersion") { settings.playerVersion = it }
    withString("sessionId") { settings.sessionId = it }
}
