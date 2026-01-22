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

        AsyncFunction("initializeCastManager") { options: Map<String, Any>? ->
            val applicationId = options?.getString("applicationId")
            val messageNamespace = options?.getString("messageNamespace")

            if (applicationId != null && messageNamespace != null) {
                Log.w(
                    "BitmovinCastManagerModule",
                    "Ignoring initialization of cast manager. Use `expoConfig` or `AndroidManifest.xml` to configure. See `example/README.md` for more information.",
                )
            }

            // no-op, as the default values are used.
            // The BitmovinCastManager is indirectly initialized via the `ActivityLifecycleListener.onCreate` callback
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
