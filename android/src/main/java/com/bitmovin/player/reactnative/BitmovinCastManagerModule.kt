package com.bitmovin.player.reactnative

import android.util.Log
import com.bitmovin.player.casting.BitmovinCastManager
import com.bitmovin.player.reactnative.extensions.getString
import expo.modules.kotlin.functions.Queues
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class BitmovinCastManagerModule : Module() {
    override fun definition() = ModuleDefinition {
        Name("BitmovinCastManagerModule")

        AsyncFunction("isInitialized") {
            BitmovinCastManager.isInitialized()
        }

        AsyncFunction("sendMessage") { message: String, messageNamespace: String? ->
            BitmovinCastManager.getInstance().sendMessage(message, messageNamespace)
        }.runOnQueue(Queues.MAIN)

        AsyncFunction("updateContext") {
            appContext.currentActivity?.let { activity ->
                BitmovinCastManager.getInstance().updateContext(activity)
            }
        }.runOnQueue(Queues.MAIN)
    }
}
