package com.bitmovin.player.reactnative

import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class NowPlayingModule : Module() {
    override fun definition() = ModuleDefinition {
        Name("NowPlayingModule")

        AsyncFunction("isEnabled") { _: String ->
            // The Now Playing integration is iOS-only, always disabled on Android.
            false
        }

        AsyncFunction("setEnabled") { _: String, _: Boolean ->
            // The Now Playing integration is iOS-only, no-op on Android.
        }
    }
}
