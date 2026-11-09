package com.bitmovin.player.reactnative

import com.bitmovin.player.api.advertising.AdvertisingConfig

internal object ImaBeforeInitializationConfigurator {
    const val IS_GOOGLE_IMA_ENABLED = false

    @Suppress("UNUSED_PARAMETER")
    fun configure(
        config: Map<String, Any?>,
        advertising: AdvertisingConfig,
        callbacks: CallbackScope,
    ): AdvertisingConfig {
        // Google IMA is disabled for this build. The JS player warns about an ignored callback.
        return advertising
    }
}
