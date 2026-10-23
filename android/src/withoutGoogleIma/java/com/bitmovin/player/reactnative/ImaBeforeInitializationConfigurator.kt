package com.bitmovin.player.reactnative

import com.bitmovin.player.api.PlayerConfig

internal object ImaBeforeInitializationConfigurator {
    const val IS_GOOGLE_IMA_ENABLED = false

    @Suppress("UNUSED_PARAMETER")
    fun configure(
        nativeId: NativeId,
        configJson: Map<String, Any?>?,
        playerConfig: PlayerConfig,
        imaSettingsWaiter: ResultWaiter<Map<String, Any?>>,
        emitEvent: (nativeId: NativeId, id: Int, payload: Map<String, Any?>) -> Unit,
    ) {
        // Google IMA is disabled for this build. The JS player warns about an ignored callback.
    }
}
