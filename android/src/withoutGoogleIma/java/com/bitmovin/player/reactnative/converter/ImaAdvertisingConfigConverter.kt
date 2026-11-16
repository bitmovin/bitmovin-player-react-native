package com.bitmovin.player.reactnative.converter

import com.bitmovin.player.api.advertising.AdvertisingConfig
import expo.modules.kotlin.AppContext

internal const val IS_GOOGLE_IMA_ENABLED = false

internal fun Map<String, Any?>.configureIma(
    advertising: AdvertisingConfig,
    appContext: AppContext,
): AdvertisingConfig = advertising
