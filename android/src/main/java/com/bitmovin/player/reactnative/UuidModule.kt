package com.bitmovin.player.reactnative

import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import java.util.UUID

/**
 * Native module for easy and fast unique ID generation on JS side. Used to generate native instance IDs.
 */
class UuidModule : Module() {
    override fun definition() = ModuleDefinition {
        Name("UuidModule")

        Function("generate") {
            UUID.randomUUID().toString()
        }
    }
}
