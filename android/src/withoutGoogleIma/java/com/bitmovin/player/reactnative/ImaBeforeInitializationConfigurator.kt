package com.bitmovin.player.reactnative

import android.util.Log
import com.bitmovin.player.api.PlayerConfig
import com.bitmovin.player.reactnative.extensions.getMap

internal object ImaBeforeInitializationConfigurator {
    @Suppress("UNUSED_PARAMETER")
    fun configure(
        nativeId: NativeId,
        configJson: Map<String, Any?>?,
        playerConfig: PlayerConfig,
        imaSettingsWaiter: ResultWaiter<Map<String, Any?>>,
        emitEvent: (nativeId: NativeId, id: Int, payload: Map<String, Any?>) -> Unit,
    ) {
        val imaJson = configJson?.getMap("advertisingConfig")?.getMap("ima") ?: return
        if (imaJson.containsKey("beforeInitialization")) {
            Log.w(
                "PlayerModule",
                "advertisingConfig.ima.beforeInitialization is ignored because Google IMA is disabled. " +
                    "Set features.googleIMA to true in the Bitmovin config plugin and rebuild the app.",
            )
        }
    }
}
