package com.bitmovin.player.reactnative.converter

import com.bitmovin.player.api.advertising.AdvertisingConfig
import com.bitmovin.player.api.advertising.BeforeInitializationCallback
import com.bitmovin.player.reactnative.callBlocking
import com.bitmovin.player.reactnative.extensions.withCallback
import com.bitmovin.player.reactnative.extensions.withMap
import com.bitmovin.player.reactnative.toNativeValue
import expo.modules.kotlin.AppContext

internal val IS_GOOGLE_IMA_ENABLED = try {
    Class.forName(
        "com.google.ads.interactivemedia.v3.api.ImaSdkSettings",
        false,
        AdvertisingConfig::class.java.classLoader,
    )
    true
} catch (_: ClassNotFoundException) {
    false
}

/** Adds the IMA-only callback to the common toAdvertisingConfig conversion. */
internal fun Map<String, Any?>.configureIma(
    advertising: AdvertisingConfig,
    appContext: AppContext,
): AdvertisingConfig {
    if (!IS_GOOGLE_IMA_ENABLED) return advertising
    return withMap("ima") { config ->
        config.withCallback("beforeInitialization") { callback ->
            advertising.copy(
                ima = advertising.ima.copy(
                    beforeInitialization = BeforeInitializationCallback { settings ->
                        val returned = callback.callBlocking(appContext, settings.toMap()) { it.toNativeValue() }
                        @Suppress("UNCHECKED_CAST")
                        (returned as? Map<String, Any?>)?.applyOnImaSettings(settings)
                    },
                ),
            )
        }
    } ?: advertising
}
