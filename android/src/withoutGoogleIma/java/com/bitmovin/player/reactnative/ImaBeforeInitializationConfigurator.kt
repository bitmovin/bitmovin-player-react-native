package com.bitmovin.player.reactnative

import com.bitmovin.player.api.PlayerConfig

internal object ImaBeforeInitializationConfigurator {
    fun configure(
        nativeId: NativeId,
        configJson: Map<String, Any?>?,
        playerConfig: PlayerConfig,
        imaSettingsWaiter: ResultWaiter<Map<String, Any?>>,
        emitEvent: (nativeId: NativeId, id: Int, payload: Map<String, Any?>) -> Unit,
    ) {
        // Google IMA is disabled for this build variant.
    }
}
