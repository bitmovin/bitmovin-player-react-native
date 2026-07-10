package com.bitmovin.player.reactnative

import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class MediaControlsModule : Module() {
    override fun definition() = ModuleDefinition {
        Name("MediaControlsModule")

        AsyncFunction("isEnabled") { _: String ->
            // The media controls integration is iOS/tvOS-only, always disabled on Android.
            false
        }

        AsyncFunction("setEnabled") { _: String, _: Boolean ->
            // The media controls integration is iOS/tvOS-only, no-op on Android.
        }
    }
}
