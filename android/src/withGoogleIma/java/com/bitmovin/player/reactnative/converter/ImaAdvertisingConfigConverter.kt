package com.bitmovin.player.reactnative.converter

import com.bitmovin.player.api.advertising.AdvertisingConfig
import com.bitmovin.player.api.advertising.BeforeInitializationCallback
import com.bitmovin.player.reactnative.callBlocking
import com.bitmovin.player.reactnative.extensions.withCallback
import com.bitmovin.player.reactnative.extensions.withMap
import com.bitmovin.player.reactnative.toNativeValue
import expo.modules.kotlin.AppContext

internal const val IS_GOOGLE_IMA_ENABLED = true

/** Adds the IMA-only callback to the common toAdvertisingConfig conversion. */
internal fun Map<String, Any?>.configureIma(
    advertising: AdvertisingConfig,
    appContext: AppContext,
): AdvertisingConfig = withMap("ima") { config ->
    config.withCallback("beforeInitialization") { callback ->
        advertising.copy(
            ima = advertising.ima.copy(
                beforeInitialization = BeforeInitializationCallback { settings ->
                    @Suppress("UNCHECKED_CAST")
                    (callback.callBlocking(appContext, settings.toMap()) { it.toNativeValue() } as? Map<String, Any?>)
                        ?.applyOnImaSettings(settings)
                },
            ),
        )
    }
} ?: advertising
