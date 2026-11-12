package com.bitmovin.player.reactnative.converter

import com.bitmovin.player.api.advertising.AdvertisingConfig
import com.bitmovin.player.api.advertising.BeforeInitializationCallback
import com.bitmovin.player.reactnative.extensions.withFunction
import com.bitmovin.player.reactnative.extensions.withMap

internal const val IS_GOOGLE_IMA_ENABLED = true

/** Adds the IMA-only callback to the common toAdvertisingConfig conversion. */
internal fun Map<String, Any?>.configureIma(
    advertising: AdvertisingConfig,
): AdvertisingConfig = withMap("ima") { config ->
    config.withFunction("beforeInitialization") { callback ->
        advertising.copy(
            ima = advertising.ima.copy(
                beforeInitialization = BeforeInitializationCallback { settings ->
                    @Suppress("UNCHECKED_CAST")
                    (callback.blockingCall(listOf(settings.toMap()), mutating = true) as? Map<String, Any?>)
                        ?.applyOnImaSettings(settings)
                },
            ),
        )
    }
} ?: advertising
