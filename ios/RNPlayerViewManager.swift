import ExpoModulesCore

public class RNPlayerViewManager: Module {
    private var playerViews: [NativeId: WeakPlayerView] = [:]
    private var pendingPictureInPictureActions: [NativeId: [RNPictureInPictureAction]] = [:]
    private var pendingIsPictureInPictureEnabled: [NativeId: Bool] = [:]

    // swiftlint:disable:next function_body_length
    public func definition() -> ModuleDefinition {
        Name("RNPlayerViewManager")

        OnDestroy { [weak self] in
            self?.playerViews.removeAll()
            self?.pendingPictureInPictureActions.removeAll()
            self?.pendingIsPictureInPictureEnabled.removeAll()
        }

        AsyncFunction("updatePictureInPictureActions") { [weak self] (playerId: NativeId, actions: [String]) in
            guard let self, let pictureInPictureActions = RCTConvert.pictureInPictureActions(actions) else {
                return
            }
            guard let view = self.playerView(for: playerId) else {
                self.pendingPictureInPictureActions[playerId] = pictureInPictureActions
                return
            }
            view.updatePictureInPictureActions(actions: pictureInPictureActions)
        }.runOnQueue(.main)

        AsyncFunction("setIsPictureInPictureEnabled") { [weak self] (playerId: NativeId, isEnabled: Bool) in
            guard let self else {
                return
            }
            guard let view = self.playerView(for: playerId) else {
                self.pendingIsPictureInPictureEnabled[playerId] = isEnabled
                return
            }
            view.setIsPictureInPictureEnabled(isEnabled)
        }.runOnQueue(.main)

        View(RNPlayerView.self) {
            Prop("config") { [weak self] (view: RNPlayerView, playerInfo: [String: Any]?) in
                let playerId = playerInfo?["playerId"] as? NativeId
                let playerViewConfigWrapper = RCTConvert
                    .rnPlayerViewConfig(playerInfo?["playerViewConfig"] as? [String: Any])
                let customMessageHandlerBridgeId = playerInfo?["customMessageHandlerBridgeId"] as? NativeId
                view.attachPlayer(
                    playerId: playerId,
                    playerViewConfigWrapper: playerViewConfigWrapper,
                    customMessageHandlerBridgeId: customMessageHandlerBridgeId
                )
                self?.registerView(view, playerId: playerId)
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

    /// Discards the Picture in Picture values that were set for a player whose view was never registered,
    /// e.g. because the player was destroyed first. Otherwise a later player with the same ID would pick them up.
    internal func discardPendingPictureInPictureValues(playerId: NativeId) {
        pendingPictureInPictureActions.removeValue(forKey: playerId)
        pendingIsPictureInPictureEnabled.removeValue(forKey: playerId)
    }

    private func playerView(for playerId: NativeId) -> RNPlayerView? {
        playerViews[playerId]?.view
    }

    /// Keeps a single view per player and applies the Picture in Picture values that were set
    /// before the view showing the player was registered.
    private func registerView(_ view: RNPlayerView, playerId: NativeId?) {
        playerViews = playerViews.filter { _, entry in
            guard let trackedView = entry.view else {
                return false
            }
            return trackedView !== view
        }
        guard let playerId else {
            return
        }
        playerViews[playerId] = WeakPlayerView(view)

        if let isEnabled = pendingIsPictureInPictureEnabled.removeValue(forKey: playerId) {
            view.setIsPictureInPictureEnabled(isEnabled)
        }
        if let actions = pendingPictureInPictureActions.removeValue(forKey: playerId) {
            view.updatePictureInPictureActions(actions: actions)
        }
    }
}

private final class WeakPlayerView {
    weak var view: RNPlayerView?

    init(_ view: RNPlayerView) {
        self.view = view
    }
}
