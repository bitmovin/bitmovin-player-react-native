package com.bitmovin.player.reactnative

import android.util.Log
import com.bitmovin.player.reactnative.converter.toPictureInPictureActions
import com.bitmovin.player.reactnative.converter.toRNPlayerViewConfigWrapper
import com.bitmovin.player.reactnative.extensions.getBooleanOrNull
import com.bitmovin.player.reactnative.extensions.getMap
import com.bitmovin.player.reactnative.extensions.getString
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class RNPlayerViewManager : Module() {
    override fun definition() = ModuleDefinition {
        Name("RNPlayerViewManager")

        View(RNPlayerView::class) {
            Prop("config") { view: RNPlayerView, playerInfo: Map<String, Any>? ->
                val playerId = playerInfo?.get("playerId") as? String
                    ?: throw IllegalArgumentException("Player info must contain 'playerId' field")
                val customMessageHandlerBridgeId = playerInfo.getString("customMessageHandlerBridgeId")
                val enableBackgroundPlayback = playerInfo.getBooleanOrNull("enableBackgroundPlayback") ?: false
                val isPictureInPictureEnabledOnPlayer =
                    playerInfo.getBooleanOrNull("isPictureInPictureEnabledOnPlayer") ?: false
                val userInterfaceTypeName = playerInfo.getString("userInterfaceTypeName")
                val playerViewConfigWrapper = playerInfo.getMap("playerViewConfig")?.toRNPlayerViewConfigWrapper()
                view.attachPlayer(
                    playerId,
                    playerViewConfigWrapper,
                    customMessageHandlerBridgeId,
                    enableBackgroundPlayback,
                    isPictureInPictureEnabledOnPlayer,
                    userInterfaceTypeName,
                )
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

            Prop("pictureInPictureActions") { view: RNPlayerView, pictureInPictureActions: List<String> ->
                view.updatePictureInPictureActions(pictureInPictureActions.toPictureInPictureActions())
            }

            AsyncFunction("updatePictureInPictureActions") { view: RNPlayerView, pictureInPictureActions: List<String> ->
                view.updatePictureInPictureActions(pictureInPictureActions.toPictureInPictureActions())
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
                "onBmpCueExit",
            )
        }
    }
}
