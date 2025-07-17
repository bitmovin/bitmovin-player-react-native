package com.bitmovin.player.reactnative

import com.bitmovin.player.casting.BitmovinCastManager
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class BitmovinCastManagerModule : Module() {
    override fun definition() = ModuleDefinition {
        Name("BitmovinCastManagerModule")

        AsyncFunction("isInitialized") {
            BitmovinCastManager.isInitialized()
        }

        AsyncFunction("initializeCastManager") { options: Map<String, Any>? ->
            val applicationId = options?.get("applicationId") as? String
            val messageNamespace = options?.get("messageNamespace") as? String

            BitmovinCastManager.initialize(
                applicationId,
                messageNamespace,
            )
        }

        AsyncFunction("sendMessage") { message: String, messageNamespace: String? ->
            BitmovinCastManager.getInstance().sendMessage(message, messageNamespace)
        }

        AsyncFunction("updateContext") {
            appContext.currentActivity?.let { activity ->
                BitmovinCastManager.getInstance().updateContext(activity)
            }
        }
    }
}
