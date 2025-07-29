package com.bitmovin.player.reactnative

import com.bitmovin.player.api.DebugConfig
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class DebugModule : Module() {
    override fun definition() = ModuleDefinition {
        Name("DebugModule")

        AsyncFunction("setDebugLoggingEnabled") { enabled: Boolean ->
            DebugConfig.isLoggingEnabled = enabled
        }
    }
}
