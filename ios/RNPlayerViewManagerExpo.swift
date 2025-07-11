import ExpoModulesCore

public class RNPlayerViewManagerExpo: Module {
    // swiftlint:disable:next function_body_length
    public func definition() -> ModuleDefinition {
        Name("RNPlayerViewManagerExpo")

        View(RNPlayerViewExpo.self) {
            Prop("config") { (view: RNPlayerViewExpo, config: [String: Any]?) in
                view.config = RCTConvert.rnPlayerViewConfig(config)
            }
            Prop("playerInfo") { (view: RNPlayerViewExpo, playerInfo: [String: Any]?) in
                let playerId = playerInfo?["id"] as? NativeId
                let customMessageHandlerBridgeId = playerInfo?["customMessageHandlerBridgeId"] as? NativeId
                view.attachPlayer(
                    playerId: playerId,
                    customMessageHandlerBridgeId: customMessageHandlerBridgeId
                )
            }
            Prop("scalingMode") { (view: RNPlayerViewExpo, scalingMode: String) in
                view.setScalingMode(scalingMode: scalingMode)
            }
            Prop("isFullscreenRequested") { (view: RNPlayerViewExpo, isFullscreenRequested: Bool) in
                view.setFullscreenRequested(isFullscreen: isFullscreenRequested)
            }
            Prop("isPictureInPictureRequested") { (view: RNPlayerViewExpo, isPictureInPictureRequested: Bool) in
                view.setPictureInPicture(enterPictureInPicture: isPictureInPictureRequested)
            }
            Prop("fullscreenBridgeId") { (view: RNPlayerViewExpo, fullscreenBridgeId: String) in
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
                "onBmpCueExit"
            )
        }
    }
}
