import ExpoModulesCore

public class RNPlayerViewManager: Module {
    // swiftlint:disable:next function_body_length
    public func definition() -> ModuleDefinition {
        Name("RNPlayerViewManager")

        View(RNPlayerView.self) {
            Prop("player") { (view: RNPlayerView, owner: SharedPlayer?) in
                view.setSharedPlayer(owner)
            }
            Prop("config") { (view: RNPlayerView, playerInfo: [String: Any]?) in
                view.configurePlayer(
                    playerViewConfig: RCTConvert.rnPlayerViewConfig(playerInfo?["playerViewConfig"] as? [String: Any])
                )
            }
            OnViewDidUpdateProps { (view: RNPlayerView) in
                view.attachConfiguredPlayer()
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
            Prop("fullscreenHandler") { (view: RNPlayerView, handler: SharedFullscreen?) in
                view.setFullscreenHandler(handler)
            }
            Prop("customMessageHandler") { (view: RNPlayerView, handler: SharedCustomMessage?) in
                view.setCustomMessageHandler(handler)
            }
            AsyncFunction("updatePictureInPictureActions") { (view: RNPlayerView, actions: [String]) in
                view.updatePictureInPictureActions(actions: RCTConvert.pictureInPictureActions(actions))
            }
            AsyncFunction("setIsPictureInPictureEnabled") { (view: RNPlayerView, value: Bool) in
                view.setIsPictureInPictureEnabled(value)
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
                "onBmpNonLinearAdStarted",
                "onBmpNonLinearAdSkipped",
                "onBmpNonLinearAdFinished",
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
                "onBmpMetadataParsed",
                "onBmpFairplayLicenseAcquired"
            )
        }
    }
}
