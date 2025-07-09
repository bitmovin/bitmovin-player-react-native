package com.bitmovin.player.reactnative

import com.bitmovin.player.reactnative.converter.toRNPlayerViewConfigWrapper
import com.bitmovin.player.reactnative.ui.FullscreenHandlerModule
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import expo.modules.kotlin.views.ViewManagerDefinition
import expo.modules.kotlin.views.ViewManager

class RNPlayerViewManagerExpo : Module() {
    override fun definition() = ModuleDefinition {
        Name("RNPlayerViewManagerExpo")

        ViewManager {
            View { context ->
                ExpoRNPlayerView(context, appContext)
            }

            Events(
                "onBmpEvent",
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
                "onBmpPictureInPictureExit",
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
                "onBmpCueExit"
            )

            Prop("config") { view: ExpoRNPlayerView, config: Map<String, Any>? ->
                view.config = config?.toRNPlayerViewConfigWrapper()
            }

            AsyncFunction("attachPlayer") { view: ExpoRNPlayerView, playerId: String, playerConfig: Map<String, Any>? ->
                view.attachPlayer(playerId, playerConfig)
            }

            AsyncFunction("attachFullscreenBridge") { view: ExpoRNPlayerView, fullscreenBridgeId: String ->
                view.playerView?.setFullscreenHandler(
                    appContext.legacyModule<FullscreenHandlerModule>()?.getInstance(fullscreenBridgeId)
                )
            }

            AsyncFunction("setFullscreen") { view: ExpoRNPlayerView, isFullscreen: Boolean ->
                view.setFullscreen(isFullscreen)
            }

            AsyncFunction("setPictureInPicture") { view: ExpoRNPlayerView, isPictureInPicture: Boolean ->
                view.setPictureInPicture(isPictureInPicture)
            }

            AsyncFunction("setScalingMode") { view: ExpoRNPlayerView, scalingMode: String ->
                view.setScalingMode(scalingMode)
            }
        }
    }
}
