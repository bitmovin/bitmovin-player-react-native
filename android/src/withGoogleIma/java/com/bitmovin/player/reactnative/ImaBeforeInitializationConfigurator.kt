package com.bitmovin.player.reactnative

import com.bitmovin.player.api.PlayerConfig
import com.bitmovin.player.api.advertising.AdvertisingConfig
import com.bitmovin.player.api.advertising.BeforeInitializationCallback
import com.bitmovin.player.reactnative.converter.applyOnImaSettings
import com.bitmovin.player.reactnative.converter.toMap
import com.bitmovin.player.reactnative.extensions.getMap

internal object ImaBeforeInitializationConfigurator {
    const val IS_GOOGLE_IMA_ENABLED = true

    fun configure(config: Map<String, Any?>?, playerConfig: PlayerConfig, callbacks: CallbackScope) {
        if (config?.getMap("advertisingConfig")?.getMap("ima")?.containsKey("beforeInitialization") != true) return
        val advertising = playerConfig.advertisingConfig ?: AdvertisingConfig()
        playerConfig.advertisingConfig = advertising.copy(
            ima = advertising.ima.copy(
                beforeInitialization = BeforeInitializationCallback { settings ->
                    @Suppress("UNCHECKED_CAST")
                    (callbacks.call("imaBeforeInitialization", listOf(settings.toMap()), 250) as? Map<String, Any?>)
                        ?.applyOnImaSettings(settings)
                },
            ),
        )
    }
}
