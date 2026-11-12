package com.bitmovin.player.reactnative.converter

import com.bitmovin.player.api.advertising.AdvertisingConfig
import com.bitmovin.player.reactnative.CallbackScope

internal const val IS_GOOGLE_IMA_ENABLED = false

/** The IMA callback's parameter type is unavailable without the optional Google SDK. */
@Suppress("UNUSED_PARAMETER")
internal fun Map<String, Any?>.configureIma(
    advertising: AdvertisingConfig,
    callbacks: CallbackScope,
): AdvertisingConfig = advertising
