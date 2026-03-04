package com.bitmovin.player.reactnative

import com.bitmovin.player.api.PlayerConfig
import com.bitmovin.player.api.advertising.AdvertisingConfig
import com.bitmovin.player.api.advertising.BeforeInitializationCallback
import com.bitmovin.player.reactnative.converter.applyOnImaSettings
import com.bitmovin.player.reactnative.converter.toImaSettingsMap
import com.bitmovin.player.reactnative.extensions.getMap

internal object ImaBeforeInitializationConfigurator {
    fun configure(
        nativeId: NativeId,
        configJson: Map<String, Any?>?,
        playerConfig: PlayerConfig,
        imaSettingsWaiter: ResultWaiter<Map<String, Any?>>,
        emitEvent: (nativeId: NativeId, id: Int, payload: Map<String, Any?>) -> Unit,
    ) {
        val advertisingConfigJson = configJson?.getMap("advertisingConfig") ?: return
        val imaJson = advertisingConfigJson.getMap("ima") ?: return
        if (!imaJson.containsKey("beforeInitialization")) {
            return
        }

        val advertisingConfig = playerConfig.advertisingConfig ?: AdvertisingConfig()
        val callback = BeforeInitializationCallback { settings ->
            val (id, wait) = imaSettingsWaiter.make(250)
            emitEvent(nativeId, id, settings.toImaSettingsMap())
            wait()?.applyOnImaSettings(settings)
        }
        val updatedIma = advertisingConfig.ima.copy(beforeInitialization = callback)
        playerConfig.advertisingConfig = advertisingConfig.copy(ima = updatedIma)
    }
}
