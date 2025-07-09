package com.bitmovin.player.reactnative

import com.bitmovin.player.casting.BitmovinCastManager
import com.bitmovin.player.reactnative.converter.toCastOptions
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import expo.modules.kotlin.types.Enumerable

class BitmovinCastManagerExpoModule : Module() {
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