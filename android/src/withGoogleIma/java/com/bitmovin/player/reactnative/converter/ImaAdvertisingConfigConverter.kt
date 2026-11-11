package com.bitmovin.player.reactnative.converter

import com.bitmovin.player.api.advertising.AdvertisingConfig
import com.bitmovin.player.api.advertising.BeforeInitializationCallback
import com.bitmovin.player.reactnative.CallbackScope
import com.bitmovin.player.reactnative.extensions.getMap
import com.bitmovin.player.reactnative.extensions.withFunction

internal const val IS_GOOGLE_IMA_ENABLED = true

internal fun Map<String, Any?>.configureIma(
    advertising: AdvertisingConfig,
    callbacks: CallbackScope,
): AdvertisingConfig = getMap("ima")?.withFunction("beforeInitialization") { token ->
    advertising.copy(
        ima = advertising.ima.copy(
            beforeInitialization = BeforeInitializationCallback { settings ->
                @Suppress("UNCHECKED_CAST")
                (callbacks.call(token, listOf(settings.toMap()), mutating = true) as? Map<String, Any?>)
                    ?.applyOnImaSettings(settings)
            },
        ),
    )
} ?: advertising
