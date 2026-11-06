import ExpoModulesCore

public class RNPlayerViewManager: Module {
    // swiftlint:disable:next function_body_length
    public func definition() -> ModuleDefinition {
        Name("RNPlayerViewManager")

        AsyncFunction("updatePictureInPictureActions") { (owner: SharedPlayer?, actions: [String]) in
            guard let owner, let actions = RCTConvert.pictureInPictureActions(actions) else { return }
            if let view = owner.view {
                view.updatePictureInPictureActions(actions: actions)
            } else {
                owner.pendingPictureInPictureActions = actions
            }
        }.runOnQueue(.main)

        AsyncFunction("setIsPictureInPictureEnabled") { (owner: SharedPlayer?, isEnabled: Bool) in
            guard let owner else { return }
            if let view = owner.view {
                view.setIsPictureInPictureEnabled(isEnabled)
            } else {
                owner.pendingIsPictureInPictureEnabled = isEnabled
            }
        }.runOnQueue(.main)

        View(RNPlayerView.self) {
            Prop("player") { (view: RNPlayerView, owner: SharedPlayer?) in
                view.setSharedPlayer(owner)
            }
            Prop("config") { (view: RNPlayerView, playerInfo: [String: Any]?) in
                view.configurePlayer(
                    playerViewConfig: RCTConvert.rnPlayerViewConfig(playerInfo?["playerViewConfig"] as? [String: Any]),
                    customMessageHandlerBridgeId: playerInfo?["customMessageHandlerBridgeId"] as? NativeId
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
            Prop("fullscreenBridgeId") { (view: RNPlayerView, fullscreenBridgeId: String) in
                view.attachFullscreenBridge(fullscreenBridgeId: fullscreenBridgeId)
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
