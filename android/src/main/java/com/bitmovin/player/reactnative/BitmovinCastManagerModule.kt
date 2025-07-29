package com.bitmovin.player.reactnative

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

        AsyncFunction("initializeCastManager") { options: Map<String, Any>? ->
            val applicationId = options?.getString("applicationId")
            val messageNamespace = options?.getString("messageNamespace")

            BitmovinCastManager.initialize(
                applicationId,
                messageNamespace,
            )
        }.runOnQueue(Queues.MAIN)

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
