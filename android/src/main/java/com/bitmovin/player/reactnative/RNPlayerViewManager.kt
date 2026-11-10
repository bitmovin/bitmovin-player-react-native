package com.bitmovin.player.reactnative

import android.os.Build
import com.bitmovin.player.reactnative.converter.toPictureInPictureActions
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import java.util.Collections
import java.util.WeakHashMap

class RNPlayerViewManager : Module() {
    // Weak Set
    private val autoPictureInPictureViews = Collections.newSetFromMap(WeakHashMap<RNPlayerView, Boolean>())

    override fun definition() = ModuleDefinition {
        Name("RNPlayerViewManager")

        OnDestroy {
            autoPictureInPictureViews.clear()
        }

        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.S) {
            // On version S or above this is handled with the PiP Parameters in the `PictureInPictureHandler`
            OnUserLeavesActivity {
                requestAutoPictureInPicture()
            }
        }

        View(RNPlayerView::class) {
            OnViewDestroys { view: RNPlayerView ->
                autoPictureInPictureViews.remove(view)
                view.dispose()
            }

            Prop("player") { view: RNPlayerView, shared: SharedPlayer? ->
                view.bindSharedPlayer(shared)
            }

            Prop("config") { view: RNPlayerView, playerInfo: Map<String, Any>? ->
                view.configure(playerInfo)
            }

            OnViewDidUpdateProps { view: RNPlayerView ->
                view.attachConfiguredPlayer()
                updateAutoPictureInPictureRegistration(view)
            }

            Prop("scalingMode") { view: RNPlayerView, scalingMode: String? ->
                view.setScalingMode(scalingMode)
            }

            Prop("isFullscreenRequested") { view: RNPlayerView, isFullscreen: Boolean ->
                view.setFullscreen(isFullscreen)
            }

            Prop("isPictureInPictureRequested") { view: RNPlayerView, isPictureInPicture: Boolean ->
                view.setPictureInPicture(isPictureInPicture)
            }

            Prop("fullscreenHandler") { view: RNPlayerView, handler: SharedFullscreen? ->
                view.attachFullscreenHandler(handler)
            }

            Prop("customMessageHandler") { view: RNPlayerView, handler: SharedCustomMessage? ->
                view.attachCustomMessageHandler(handler)
            }

            AsyncFunction("updatePictureInPictureActions") { view: RNPlayerView, actions: List<String> ->
                view.updatePictureInPictureActions(actions.toPictureInPictureActions())
            }
            AsyncFunction("setIsPictureInPictureEnabled") { view: RNPlayerView, enabled: Boolean ->
                view.setIsPictureInPictureEnabled(enabled)
                updateAutoPictureInPictureRegistration(view)
            }

            Events(
                "onBmpPlayerViewReady",
                "onBmpPictureInPictureAvailabilityChanged",
                "onBmpPictureInPictureEnter",
                "onBmpPictureInPictureEntered",
                "onBmpPictureInPictureExit",
                "onBmpPictureInPictureExited",
                "onBmpFullscreenEnabled",
                "onBmpFullscreenDisabled",
                "onBmpFullscreenEnter",
                "onBmpFullscreenExit",
            )
        }
    }

    private fun updateAutoPictureInPictureRegistration(view: RNPlayerView) {
        if (view.shouldEnterPictureInPictureOnBackground()) {
            autoPictureInPictureViews.add(view)
        } else {
            autoPictureInPictureViews.remove(view)
        }
    }

    private fun requestAutoPictureInPicture() = autoPictureInPictureViews
        .firstOrNull { it.requestPictureInPictureOnBackgroundTransition() }
}
