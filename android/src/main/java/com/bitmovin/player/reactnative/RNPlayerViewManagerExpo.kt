package com.bitmovin.player.reactnative

import com.bitmovin.player.reactnative.converter.toRNPlayerViewConfigWrapper
// import com.bitmovin.player.reactnative.ui.FullscreenHandlerModule - TODO: Fix fullscreen handler integration
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class RNPlayerViewManagerExpo : Module() {
    override fun definition() = ModuleDefinition {
        Name("RNPlayerViewManagerExpo")

        View(RNPlayerViewExpo::class) {
            Prop("config") { view: RNPlayerViewExpo, config: Map<String, Any>? ->
                view.config = config?.toReadableMap()?.toRNPlayerViewConfigWrapper()
            }

            Prop("playerConfig") { view: RNPlayerViewExpo, playerConfig: Map<String, Any>? ->
                val playerId = playerConfig?.get("id") as? String
                    ?: throw IllegalArgumentException("Player config must contain 'id' field")
                view.attachPlayer(playerId, playerConfig)
            }

            Prop("scalingMode") { view: RNPlayerViewExpo, scalingMode: String ->
                view.setScalingMode(scalingMode)
            }

            Prop("isFullscreenRequested") { view: RNPlayerViewExpo, isFullscreen: Boolean ->
                view.setFullscreen(isFullscreen)
            }

            Prop("isPictureInPictureRequested") { view: RNPlayerViewExpo, isPictureInPicture: Boolean ->
                view.setPictureInPicture(isPictureInPicture)
            }

            Prop("fullscreenBridgeId") { view: RNPlayerViewExpo, fullscreenBridgeId: String ->
                // TODO: Implement fullscreen handler integration with Expo modules
                // view.playerView?.setFullscreenHandler(...)
            }

            Prop("customMessageHandlerBridgeId") { view: RNPlayerViewExpo, bridgeId: String ->
                // TODO: Implement custom message handler integration with Expo modules
//                view.setCustomMessageHandlerBridgeId(customMessageHandlerBridgeId: bridgeId)
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
        }
    }
}