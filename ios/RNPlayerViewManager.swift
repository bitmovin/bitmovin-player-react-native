import ExpoModulesCore

public class RNPlayerViewManager: Module {
    // swiftlint:disable:next function_body_length
    public func definition() -> ModuleDefinition {
        Name("RNPlayerViewManager")

        View(RNPlayerView.self) {
            Prop("config") { (view: RNPlayerView, playerInfo: [String: Any]?) in
                let playerId = playerInfo?["playerId"] as? NativeId
                let playerViewConfigWrapper = RCTConvert
                    .rnPlayerViewConfig(playerInfo?["playerViewConfig"] as? [String: Any])
                let customMessageHandlerBridgeId = playerInfo?["customMessageHandlerBridgeId"] as? NativeId
                view.attachPlayer(
                    playerId: playerId,
                    playerViewConfigWrapper: playerViewConfigWrapper,
                    customMessageHandlerBridgeId: customMessageHandlerBridgeId
                )
            }
            Prop("scalingMode") { (view: RNPlayerView, scalingMode: String?) in
                view.setScalingMode(scalingMode: scalingMode)
            }
            Prop("isFullscreenRequested") { (view: RNPlayerView, isFullscreenRequested: Bool) in
                view.setFullscreenRequested(isFullscreen: isFullscreenRequested)
            }
            Prop("isPictureInPictureRequested") { (view: RNPlayerView, isPictureInPictureRequested: Bool) in
                view.setPictureInPicture(enterPictureInPicture: isPictureInPictureRequested)
            }
            Prop("fullscreenBridgeId") { (view: RNPlayerView, fullscreenBridgeId: String) in
                view.attachFullscreenBridge(fullscreenBridgeId: fullscreenBridgeId)
            }

            Events(
                "onBmpEvent",
                "onBmpPlayerActive",
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
                "onBmpAudioRemoved",
                "onBmpAudioChanged",
                "onBmpSubtitleAdded",
                "onBmpSubtitleRemoved",
                "onBmpSubtitleChanged",
                "onBmpDownloadFinished",
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
                "onBmpVideoDownloadQualityChanged",
                "onBmpVideoPlaybackQualityChanged",
                "onBmpFullscreenEnabled",
                "onBmpFullscreenDisabled",
                "onBmpFullscreenEnter",
                "onBmpFullscreenExit",
                "onBmpCastAvailable",
                "onBmpCastPaused",
                "onBmpCastPlaybackFinished",
                "onBmpCastPlaying",
                "onBmpCastStarted",
                "onBmpCastStart",
                "onBmpCastStopped",
                "onBmpCastTimeUpdated",
                "onBmpCastWaitingForDevice",
                "onBmpPictureInPictureAvailabilityChanged",
                "onBmpPlaybackSpeedChanged",
                "onBmpCueEnter",
                "onBmpCueExit",
                "onBmpMetadata",
                "onBmpMetadataParsed"
            )
        }
    }
}
