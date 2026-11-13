package com.bitmovin.player.reactnative

import android.os.Build
import com.bitmovin.player.reactnative.converter.toPictureInPictureActions
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import java.util.Collections
import java.util.WeakHashMap

class PlayerViewModule : Module() {
    // Weak Set
    private val autoPictureInPictureViews = Collections.newSetFromMap(WeakHashMap<RNPlayerView, Boolean>())

    override fun definition() = ModuleDefinition {
        Name("PlayerViewModule")

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

            Prop("scalingMode") { view: RNPlayerView, scalingMode: String? ->
                view.setScalingMode(scalingMode)
            }

            Prop("isFullscreenRequested") { view: RNPlayerView, isFullscreen: Boolean ->
                view.setFullscreen(isFullscreen)
            }

            Prop("isPictureInPictureRequested") { view: RNPlayerView, isPictureInPicture: Boolean ->
                view.setPictureInPicture(isPictureInPicture)
            }

            AsyncFunction("attachBindings") { view: RNPlayerView, playerId: String,
                fullscreenId: String?, messagesId: String?,
                config: Map<String, Any>?, ->
                val player = checkNotNull(PlayerRegistry.getPlayer(playerId)) {
                    "Cannot attach an uninitialized player"
                }
                view.attachBindings(
                    player,
                    fullscreenId?.let { appContext.registry.getModule<FullscreenHandlerModule>()?.getInstance(it) },
                    messagesId?.let { appContext.registry.getModule<CustomMessageHandlerModule>()?.getInstance(it) },
                    config,
                )
                updateAutoPictureInPictureRegistration(view)
            }

            AsyncFunction("updatePictureInPictureActions") { view: RNPlayerView, actions: List<String> ->
                view.updatePictureInPictureActions(actions.toPictureInPictureActions())
            }
            AsyncFunction("setIsPictureInPictureEnabled") { view: RNPlayerView, enabled: Boolean ->
                view.setIsPictureInPictureEnabled(enabled)
                updateAutoPictureInPictureRegistration(view)
            }

            Events(
                "onBmpViewAttached",
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
