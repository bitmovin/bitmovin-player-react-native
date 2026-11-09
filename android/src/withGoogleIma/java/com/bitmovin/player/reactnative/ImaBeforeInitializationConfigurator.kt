package com.bitmovin.player.reactnative

import com.bitmovin.player.api.advertising.AdvertisingConfig
import com.bitmovin.player.api.advertising.BeforeInitializationCallback
import com.bitmovin.player.reactnative.converter.applyOnImaSettings
import com.bitmovin.player.reactnative.converter.toMap
import com.bitmovin.player.reactnative.extensions.getMap
import com.bitmovin.player.reactnative.extensions.withFunction

internal object ImaBeforeInitializationConfigurator {
    const val IS_GOOGLE_IMA_ENABLED = true

    fun configure(
        config: Map<String, Any?>,
        advertising: AdvertisingConfig,
        callbacks: CallbackScope,
    ): AdvertisingConfig {
        return config.getMap("ima")?.withFunction("beforeInitialization") {
            advertising.copy(
                ima = advertising.ima.copy(
                    beforeInitialization = BeforeInitializationCallback { settings ->
                        @Suppress("UNCHECKED_CAST")
                        (
                            callbacks.call(
                                "advertisingConfig.ima.beforeInitialization",
                                listOf(settings.toMap()),
                                mutating = true,
                            ) as? Map<String, Any?>
                            )
                            ?.applyOnImaSettings(settings)
                    },
                ),
            )
        } ?: advertising
    }
}
