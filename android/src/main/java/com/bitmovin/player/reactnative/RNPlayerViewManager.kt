package com.bitmovin.player.reactnative

import android.os.Build
import com.bitmovin.player.reactnative.converter.toPictureInPictureActions
import expo.modules.kotlin.functions.Queues
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

        AsyncFunction("updatePictureInPictureActions") { shared: SharedPlayer?, pictureInPictureActions: List<String> ->
            val actions = pictureInPictureActions.toPictureInPictureActions()
            shared?.attachedView?.let { view ->
                view.updatePictureInPictureActions(actions)
            } ?: run {
                shared?.pendingPictureInPictureActions = actions
            }
        }.runOnQueue(Queues.MAIN)

        AsyncFunction("setIsPictureInPictureEnabled") { shared: SharedPlayer?, isEnabled: Boolean ->
            shared?.attachedView?.let { view ->
                view.setIsPictureInPictureEnabled(isEnabled)
                updateAutoPictureInPictureRegistration(view)
            } ?: run {
                shared?.pendingIsPictureInPictureEnabled = isEnabled
            }
        }.runOnQueue(Queues.MAIN)

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

            Prop("fullscreenBridgeId") { view: RNPlayerView, fullscreenBridgeId: String ->
                view.attachFullscreenBridge(fullscreenBridgeId)
            }

            Events(
                "onBmpPlayerViewReady",
                "onBmpEvent",
                "onBmpPlayerActive",
                "onBmpPlayerInactive",
                "onBmpPlayerError",
                "onBmpPlayerWarning",
                "onBmpDestroy",
                "onBmpMuted",
                "onBmpUnmuted",
                "onBmpReady",
                "onBmpPaused",
                "onBmpPlay",
                "onBmpPlaying",
                "onBmpPlaybackFinished",
                "onBmpSeek",
                "onBmpSeeked",
                "onBmpTimeShift",
                "onBmpTimeShifted",
                "onBmpStallStarted",
                "onBmpStallEnded",
                "onBmpTimeChanged",
                "onBmpSourceLoad",
                "onBmpSourceLoaded",
                "onBmpSourceUnloaded",
                "onBmpSourceError",
                "onBmpSourceWarning",
                "onBmpAudioAdded",
                "onBmpAudioChanged",
                "onBmpAudioRemoved",
                "onBmpSubtitleAdded",
                "onBmpSubtitleChanged",
                "onBmpSubtitleRemoved",
                "onBmpDownloadFinished",
                "onBmpVideoDownloadQualityChanged",
                "onBmpPictureInPictureAvailabilityChanged",
                "onBmpPictureInPictureEnter",
                "onBmpPictureInPictureEntered",
                "onBmpPictureInPictureExit",
                "onBmpPictureInPictureExited",
                "onBmpAdBreakFinished",
                "onBmpAdBreakStarted",
                "onBmpAdClicked",
                "onBmpAdError",
                "onBmpAdFinished",
                "onBmpAdManifestLoad",
                "onBmpAdManifestLoaded",
                "onBmpAdQuartile",
                "onBmpAdScheduled",
                "onBmpAdSkipped",
                "onBmpAdStarted",
                "onBmpNonLinearAdStarted",
                "onBmpNonLinearAdSkipped",
                "onBmpNonLinearAdFinished",
                "onBmpVideoPlaybackQualityChanged",
                "onBmpFullscreenEnabled",
                "onBmpFullscreenDisabled",
                "onBmpFullscreenEnter",
                "onBmpFullscreenExit",
                "onBmpCastStart",
                "onBmpCastPlaybackFinished",
                "onBmpCastPaused",
                "onBmpCastPlaying",
                "onBmpCastStarted",
                "onBmpCastAvailable",
                "onBmpCastStopped",
                "onBmpCastWaitingForDevice",
                "onBmpCastTimeUpdated",
                "onBmpCueEnter",
                "onBmpCueExit",
                "onBmpMetadata",
                "onBmpMetadataParsed",
                "onBmpPlaybackSpeedChanged",
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
