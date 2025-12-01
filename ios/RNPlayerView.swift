// swiftlint:disable file_length
import BitmovinPlayer
import ExpoModulesCore

public class RNPlayerView: ExpoView {
    var playerView: PlayerView? {
        willSet {
            playerView?.removeFromSuperview()
            avPlayerViewControllerTransitionForced = false
            newValue?.autoresizingMask = [
                .flexibleWidth,
                .flexibleHeight
            ]
        }
        didSet {
            guard let playerView else {
                return
            }
            addSubview(playerView)
            maybeFixAVPlayerViewControllerVisibility()
            if let fullscreenBridgeId {
                attachFullscreenBridge(fullscreenBridgeId: fullscreenBridgeId)
            }
            if let scalingMode {
                playerView.scalingMode = scalingMode
            }
            if let requestedFullscreenValue {
                setFullscreenRequested(isFullscreen: requestedFullscreenValue)
            }
            if let requestedPictureInPictureValue {
                setPictureInPicture(enterPictureInPicture: requestedPictureInPictureValue)
            }
        }
    }

    private var customMessageHandlerBridgeId: NativeId?
    private var playerId: NativeId?
    private var fullscreenBridgeId: NativeId?
    private var scalingMode: ScalingMode?
    private var requestedFullscreenValue: Bool?
    private var requestedPictureInPictureValue: Bool?
    private var avPlayerViewControllerTransitionForced = false

    let onBmpEvent = EventDispatcher()
    let onBmpPlayerActive = EventDispatcher()
    let onBmpPlayerError = EventDispatcher()
    let onBmpPlayerWarning = EventDispatcher()
    let onBmpDestroy = EventDispatcher()
    let onBmpMuted = EventDispatcher()
    let onBmpUnmuted = EventDispatcher()
    let onBmpReady = EventDispatcher()
    let onBmpPaused = EventDispatcher()
    let onBmpPlay = EventDispatcher()
    let onBmpPlaying = EventDispatcher()
    let onBmpPlaybackFinished = EventDispatcher()
    let onBmpSeek = EventDispatcher()
    let onBmpSeeked = EventDispatcher()
    let onBmpTimeShift = EventDispatcher()
    let onBmpTimeShifted = EventDispatcher()
    let onBmpStallStarted = EventDispatcher()
    let onBmpStallEnded = EventDispatcher()
    let onBmpTimeChanged = EventDispatcher()
    let onBmpSourceLoad = EventDispatcher()
    let onBmpSourceLoaded = EventDispatcher()
    let onBmpSourceUnloaded = EventDispatcher()
    let onBmpSourceError = EventDispatcher()
    let onBmpSourceWarning = EventDispatcher()
    let onBmpAudioAdded = EventDispatcher()
    let onBmpAudioRemoved = EventDispatcher()
    let onBmpAudioChanged = EventDispatcher()
    let onBmpSubtitleAdded = EventDispatcher()
    let onBmpSubtitleRemoved = EventDispatcher()
    let onBmpSubtitleChanged = EventDispatcher()
    let onBmpDownloadFinished = EventDispatcher()
    let onBmpPictureInPictureEnter = EventDispatcher()
    let onBmpPictureInPictureEntered = EventDispatcher()
    let onBmpPictureInPictureExit = EventDispatcher()
    let onBmpPictureInPictureExited = EventDispatcher()
    let onBmpAdBreakFinished = EventDispatcher()
    let onBmpAdBreakStarted = EventDispatcher()
    let onBmpAdClicked = EventDispatcher()
    let onBmpAdError = EventDispatcher()
    let onBmpAdFinished = EventDispatcher()
    let onBmpAdManifestLoad = EventDispatcher()
    let onBmpAdManifestLoaded = EventDispatcher()
    let onBmpAdQuartile = EventDispatcher()
    let onBmpAdScheduled = EventDispatcher()
    let onBmpAdSkipped = EventDispatcher()
    let onBmpAdStarted = EventDispatcher()
    let onBmpVideoDownloadQualityChanged = EventDispatcher()
    let onBmpVideoPlaybackQualityChanged = EventDispatcher()
    let onBmpFullscreenEnabled = EventDispatcher()
    let onBmpFullscreenDisabled = EventDispatcher()
    let onBmpFullscreenEnter = EventDispatcher()
    let onBmpFullscreenExit = EventDispatcher()
    let onBmpCastAvailable = EventDispatcher()
    let onBmpCastPaused = EventDispatcher()
    let onBmpCastPlaybackFinished = EventDispatcher()
    let onBmpCastPlaying = EventDispatcher()
    let onBmpCastStarted = EventDispatcher()
    let onBmpCastStart = EventDispatcher()
    let onBmpCastStopped = EventDispatcher()
    let onBmpCastTimeUpdated = EventDispatcher()
    let onBmpCastWaitingForDevice = EventDispatcher()
    let onBmpPictureInPictureAvailabilityChanged = EventDispatcher()
    let onBmpPlaybackSpeedChanged = EventDispatcher()
    let onBmpCueEnter = EventDispatcher()
    let onBmpCueExit = EventDispatcher()

    required init(appContext: AppContext? = nil) {
        super.init(appContext: appContext)
        clipsToBounds = true
    }

    override public func layoutSubviews() {
        super.layoutSubviews()
        maybeFixAVPlayerViewControllerVisibility()
    }

    internal func attachPlayer(
        playerId: NativeId?,
        playerViewConfigWrapper: RNPlayerViewConfig?,
        customMessageHandlerBridgeId: NativeId?
    ) {
        self.playerId = playerId
        guard let playerId else {
            playerView?.player?.remove(listener: self)
            playerView?.player = nil
            return
        }
        guard let player = self.appContext?.moduleRegistry.get(PlayerModule.self)?.retrieve(playerId) else {
            return
        }

        if let userInterfaceConfig = maybeCreateUserInterfaceConfig(
            styleConfig: player.config.styleConfig,
            playerViewConfig: playerViewConfigWrapper,
            customMessageHandlerBridgeId: customMessageHandlerBridgeId
        ) {
            player.config.styleConfig.userInterfaceConfig = userInterfaceConfig
        }

        let previousPictureInPictureAvailableValue: Bool
        if let playerView {
            playerView.player = player
            previousPictureInPictureAvailableValue = playerView.isPictureInPictureAvailable
        } else {
            self.playerView = PlayerView(
                player: player,
                frame: bounds,
                playerViewConfig: playerViewConfigWrapper?.playerViewConfig ?? PlayerViewConfig()
            )
            previousPictureInPictureAvailableValue = false
        }

        player.add(listener: self)
        playerView?.add(listener: self)

        self.maybeEmitPictureInPictureAvailabilityEvent(
            previousState: previousPictureInPictureAvailableValue
        )
    }

    internal func attachFullscreenBridge(fullscreenBridgeId: NativeId) {
        self.fullscreenBridgeId = fullscreenBridgeId
        guard let fullscreenBridgeModule = self.appContext?.moduleRegistry.get(FullscreenHandlerModule.self),
              let fullscreenBridge = fullscreenBridgeModule.retrieve(fullscreenBridgeId) else {
            return
        }
        playerView?.fullscreenHandler = fullscreenBridge
    }

    internal func setFullscreenRequested(isFullscreen: Bool) {
        guard let playerView else {
            requestedFullscreenValue = isFullscreen
            return
        }

        requestedFullscreenValue = nil
        guard playerView.isFullscreen != isFullscreen else {
            return
        }

        if isFullscreen {
            playerView.enterFullscreen()
        } else {
            playerView.exitFullscreen()
        }
    }

    internal func setPictureInPicture(enterPictureInPicture: Bool) {
        guard let playerView else {
            requestedPictureInPictureValue = enterPictureInPicture
            return
        }
        requestedPictureInPictureValue = nil
        guard playerView.isPictureInPicture != enterPictureInPicture else {
            return
        }
        if enterPictureInPicture {
            playerView.enterPictureInPicture()
        } else {
            playerView.exitPictureInPicture()
        }
    }

    internal func setScalingMode(scalingMode: String?) {
        switch scalingMode {
        case "Zoom":
            self.scalingMode = .zoom
        case "Stretch":
            self.scalingMode = .stretch
        case "Fit":
            self.scalingMode = .fit
        default:
            self.scalingMode = .fit
        }
        guard let playerView, let nativeScalingMode = self.scalingMode else {
            return
        }
        playerView.scalingMode = nativeScalingMode
    }

    internal func setPictureInPictureActions(actions: [RNPictureInPictureAction]?) {
        guard let actions else {
            return
        }
        self.playerView?.pictureInPicture.showSkipControls = actions.contains(RNPictureInPictureAction.seek)
    }
}

private extension RNPlayerView {
    // Helper methods no longer needed - using EventDispatcher properties directly
}

private extension Event {
    func eventPayload() -> [String: Any] {
        guard let jsonConvertible = self as? JsonConvertible else {
            return [:]
        }
        let anyHashableKeyedPayload = jsonConvertible.toJSON()
        let stringKeyedPayload = anyHashableKeyedPayload.reduce(into: [String: Any]()) { result, pair in
            if let key = pair.key as? String {
                result[key] = pair.value
            }
        }
        return NonFiniteSanitizer.sanitizeEventData(stringKeyedPayload)
    }
}

extension RNPlayerView: PlayerListener {
    public func onPlayerActive(_ event: PlayerActiveEvent, player: Player) {
        onBmpPlayerActive(event.eventPayload())
    }

    public func onPlayerError(_ event: PlayerErrorEvent, player: Player) {
        onBmpPlayerError(event.eventPayload())
    }

    public func onPlayerWarning(_ event: PlayerWarningEvent, player: Player) {
        onBmpPlayerWarning(event.eventPayload())
    }

    public func onDestroy(_ event: DestroyEvent, player: Player) {
        onBmpDestroy(event.eventPayload())
    }

    public func onMuted(_ event: MutedEvent, player: Player) {
        onBmpMuted(event.eventPayload())
    }

    public func onUnmuted(_ event: UnmutedEvent, player: Player) {
        onBmpUnmuted(event.eventPayload())
    }

    public func onReady(_ event: ReadyEvent, player: Player) {
        onBmpReady(event.eventPayload())
    }

    public func onPaused(_ event: PausedEvent, player: Player) {
        onBmpPaused(event.eventPayload())
    }

    public func onPlay(_ event: PlayEvent, player: Player) {
        onBmpPlay(event.eventPayload())
    }

    public func onPlaying(_ event: PlayingEvent, player: Player) {
        onBmpPlaying(event.eventPayload())
    }

    public func onPlaybackFinished(_ event: PlaybackFinishedEvent, player: Player) {
        onBmpPlaybackFinished(event.eventPayload())
    }

    public func onSeek(_ event: SeekEvent, player: Player) {
        onBmpSeek(event.eventPayload())
    }

    public func onSeeked(_ event: SeekedEvent, player: Player) {
        onBmpSeeked(event.eventPayload())
    }

    public func onTimeShift(_ event: TimeShiftEvent, player: Player) {
        onBmpTimeShift(event.eventPayload())
    }

    public func onTimeShifted(_ event: TimeShiftedEvent, player: Player) {
        onBmpTimeShifted(event.eventPayload())
    }

    public func onStallStarted(_ event: StallStartedEvent, player: Player) {
        onBmpStallStarted(event.eventPayload())
    }

    public func onStallEnded(_ event: StallEndedEvent, player: Player) {
        onBmpStallEnded(event.eventPayload())
    }

    public func onTimeChanged(_ event: TimeChangedEvent, player: Player) {
        onBmpTimeChanged(event.eventPayload())
    }

    public func onPlaybackSpeedChanged(_ event: PlaybackSpeedChangedEvent, player: Player) {
        onBmpPlaybackSpeedChanged(event.eventPayload())
    }

    public func onSourceLoad(_ event: SourceLoadEvent, player: Player) {
        onBmpSourceLoad(event.eventPayload())
    }

    public func onSourceLoaded(_ event: SourceLoadedEvent, player: Player) {
        onBmpSourceLoaded(event.eventPayload())
    }

    public func onSourceUnloaded(_ event: SourceUnloadedEvent, player: Player) {
        onBmpSourceUnloaded(event.eventPayload())
    }

    public func onSourceError(_ event: SourceErrorEvent, player: Player) {
        onBmpSourceError(event.eventPayload())
    }

    public func onSourceWarning(_ event: SourceWarningEvent, player: Player) {
        onBmpSourceWarning(event.eventPayload())
    }

    public func onAudioAdded(_ event: AudioAddedEvent, player: Player) {
        onBmpAudioAdded(event.eventPayload())
    }

    public func onAudioRemoved(_ event: AudioRemovedEvent, player: Player) {
        onBmpAudioRemoved(event.eventPayload())
    }

    public func onAudioChanged(_ event: AudioChangedEvent, player: Player) {
        onBmpAudioChanged(event.eventPayload())
    }

    public func onSubtitleAdded(_ event: SubtitleAddedEvent, player: Player) {
        onBmpSubtitleAdded(event.eventPayload())
    }

    public func onSubtitleRemoved(_ event: SubtitleRemovedEvent, player: Player) {
        onBmpSubtitleRemoved(event.eventPayload())
    }

    public func onSubtitleChanged(_ event: SubtitleChangedEvent, player: Player) {
        onBmpSubtitleChanged(event.eventPayload())
    }

    public func onDownloadFinished(_ event: DownloadFinishedEvent, player: Player) {
        onBmpDownloadFinished(event.eventPayload())
    }

    public func onAdBreakFinished(_ event: AdBreakFinishedEvent, player: Player) {
        onBmpAdBreakFinished(event.eventPayload())
    }

    public func onAdBreakStarted(_ event: AdBreakStartedEvent, player: Player) {
        onBmpAdBreakStarted(event.eventPayload())
    }

    public func onAdClicked(_ event: AdClickedEvent, player: Player) {
        onBmpAdClicked(event.eventPayload())
    }

    public func onAdError(_ event: AdErrorEvent, player: Player) {
        onBmpAdError(event.eventPayload())
    }

    public func onAdFinished(_ event: AdFinishedEvent, player: Player) {
        onBmpAdFinished(event.eventPayload())
    }

    public func onAdManifestLoad(_ event: AdManifestLoadEvent, player: Player) {
        onBmpAdManifestLoad(event.eventPayload())
    }

    public func onAdManifestLoaded(_ event: AdManifestLoadedEvent, player: Player) {
        onBmpAdManifestLoaded(event.eventPayload())
    }

    public func onAdQuartile(_ event: AdQuartileEvent, player: Player) {
        onBmpAdQuartile(event.eventPayload())
    }

    public func onAdScheduled(_ event: AdScheduledEvent, player: Player) {
        onBmpAdScheduled(event.eventPayload())
    }

    public func onAdSkipped(_ event: AdSkippedEvent, player: Player) {
        onBmpAdSkipped(event.eventPayload())
    }

    public func onAdStarted(_ event: AdStartedEvent, player: Player) {
        onBmpAdStarted(event.eventPayload())
    }

    public func onVideoDownloadQualityChanged(_ event: VideoDownloadQualityChangedEvent, player: Player) {
        onBmpVideoDownloadQualityChanged(event.eventPayload())
     }

    public func onVideoPlaybackQualityChanged(_ event: VideoPlaybackQualityChangedEvent, player: Player) {
        onBmpVideoPlaybackQualityChanged(event.eventPayload())
    }

    public func onCueEnter(_ event: CueEnterEvent, player: Player) {
        onBmpCueEnter(event.eventPayload())
    }

    public func onCueExit(_ event: CueExitEvent, player: Player) {
        onBmpCueExit(event.eventPayload())
    }

#if os(iOS)
    public func onCastAvailable(_ event: CastAvailableEvent, player: Player) {
        onBmpCastAvailable(event.eventPayload())
    }

    public func onCastPaused(_ event: CastPausedEvent, player: Player) {
        onBmpCastPaused(event.eventPayload())
    }

    public func onCastPlaybackFinished(_ event: CastPlaybackFinishedEvent, player: Player) {
        onBmpCastPlaybackFinished(event.eventPayload())
    }

    public func onCastPlaying(_ event: CastPlayingEvent, player: Player) {
        onBmpCastPlaying(event.eventPayload())
    }

    public func onCastStarted(_ event: CastStartedEvent, player: Player) {
        onBmpCastStarted(event.eventPayload())
    }

    public func onCastStart(_ event: CastStartEvent, player: Player) {
        onBmpCastStart(event.eventPayload())
    }

    public func onCastStopped(_ event: CastStoppedEvent, player: Player) {
        onBmpCastStopped(event.eventPayload())
    }

    public func onCastTimeUpdated(_ event: CastTimeUpdatedEvent, player: Player) {
        onBmpCastTimeUpdated(event.eventPayload())
    }

    public func onCastWaiting(forDevice event: CastWaitingForDeviceEvent, player: Player) {
        onBmpCastWaitingForDevice(event.eventPayload())
    }
#endif
}

extension RNPlayerView: UserInterfaceListener {
    public func onPictureInPictureEnter(_ event: PictureInPictureEnterEvent, view: PlayerView) {
        onBmpPictureInPictureEnter(event.eventPayload())
    }

    public func onPictureInPictureEntered(_ event: PictureInPictureEnteredEvent, view: PlayerView) {
        onBmpPictureInPictureEntered(event.eventPayload())
    }

    public func onPictureInPictureExit(_ event: PictureInPictureExitEvent, view: PlayerView) {
        onBmpPictureInPictureExit(event.eventPayload())
    }

    public func onPictureInPictureExited(_ event: PictureInPictureExitedEvent, view: PlayerView) {
        onBmpPictureInPictureExited(event.eventPayload())
    }

    public func onFullscreenEnter(_ event: FullscreenEnterEvent, view: PlayerView) {
        onBmpFullscreenEnter(event.eventPayload())
    }

    public func onFullscreenExit(_ event: FullscreenExitEvent, view: PlayerView) {
        onBmpFullscreenExit(event.eventPayload())
    }

    public func onFullscreenEnabled(_ event: FullscreenEnabledEvent, view: PlayerView) {
        onBmpFullscreenEnabled(event.eventPayload())
    }

    public func onFullscreenDisabled(_ event: FullscreenDisabledEvent, view: PlayerView) {
        onBmpFullscreenDisabled(event.eventPayload())
    }

    public func onEvent(_ event: any Event, player: any Player) {
        onBmpEvent(event.eventPayload())
    }
}

private extension RNPlayerView {
    /// This method is used to fix the visibility issue of `AVPlayerViewController` when it is presented on iOS 17
    /// or earlier when using the new architecture.
    func maybeFixAVPlayerViewControllerVisibility() {
#if RCT_NEW_ARCH_ENABLED
        guard !avPlayerViewControllerTransitionForced,
              let avPlayerViewController = AVPlayerViewController.findAVPlayerViewController(in: window) else {
            return
        }
        avPlayerViewControllerTransitionForced = true
        avPlayerViewController.beginAppearanceTransition(true, animated: false)
        avPlayerViewController.endAppearanceTransition()
#endif
    }

    func maybeCreateUserInterfaceConfig(
        styleConfig: StyleConfig,
        playerViewConfig: RNPlayerViewConfig?,
        customMessageHandlerBridgeId: NativeId?
    ) -> UserInterfaceConfig? {
        #if os(iOS)
        if styleConfig.userInterfaceType == .bitmovin {
            let bitmovinUserInterfaceConfig = styleConfig
                .userInterfaceConfig as? BitmovinUserInterfaceConfig ?? BitmovinUserInterfaceConfig()

            if let uiConfig = playerViewConfig?.uiConfig {
                bitmovinUserInterfaceConfig
                    .playbackSpeedSelectionEnabled = uiConfig.playbackSpeedSelectionEnabled
                bitmovinUserInterfaceConfig.uiManagerFactoryFunction = uiConfig.uiManagerFactoryFunction
            }
            if let hideFirstFrame = playerViewConfig?.hideFirstFrame {
                bitmovinUserInterfaceConfig.hideFirstFrame = hideFirstFrame
            }

            if let customMessageHandlerBridgeId {
                attachCustomMessageHandlerBridge(id: customMessageHandlerBridgeId, to: bitmovinUserInterfaceConfig)
            }

            return bitmovinUserInterfaceConfig
        }
        #endif
        if styleConfig.userInterfaceType == .system {
            let systemUserInterfaceConfig = styleConfig
                .userInterfaceConfig as? SystemUserInterfaceConfig ?? SystemUserInterfaceConfig()

            if let hideFirstFrame = playerViewConfig?.hideFirstFrame {
                systemUserInterfaceConfig.hideFirstFrame = hideFirstFrame
            }

            return systemUserInterfaceConfig
        }

        return nil
    }

    #if os(iOS)
    func attachCustomMessageHandlerBridge(
        id customMessageHandlerBridgeId: NativeId,
        to bitmovinUserInterfaceConfig: BitmovinUserInterfaceConfig
    ) {
        guard let customMessageHandlerBridgeModule = self.appContext?.moduleRegistry
            .get(CustomMessageHandlerModule.self) else {
            return
        }
        guard let customMessageHandlerBridge = customMessageHandlerBridgeModule
            .retrieve(customMessageHandlerBridgeId) else {
            return
        }

        bitmovinUserInterfaceConfig.customMessageHandler = customMessageHandlerBridge.customMessageHandler
    }
    #endif

    @MainActor
    func maybeEmitPictureInPictureAvailabilityEvent(previousState: Bool) {
        guard let playerView, playerView.isPictureInPictureAvailable != previousState else {
            return
        }
        let event: [String: Any] = [
            "isPictureInPictureAvailable": playerView.isPictureInPictureAvailable,
            "name": "onPictureInPictureAvailabilityChanged",
            "timestamp": Date().timeIntervalSince1970
        ]

        onBmpPictureInPictureAvailabilityChanged(event)
    }
}

private extension UIViewController {
    func findChildViewController(matching check: (UIViewController) -> Bool) -> UIViewController? {
        if check(self) {
            return self
        }
        for child in children {
            if check(child) {
                return child
            }
            if let found = child.findChildViewController(matching: check) {
                return found
            }
        }
        return nil
    }
}

private extension AVPlayerViewController {
    static func findAVPlayerViewController(in window: UIWindow?) -> AVPlayerViewController? {
        guard let avPlayerViewController = window?
            .rootViewController?
            .findChildViewController(matching: { $0 is AVPlayerViewController }) as? AVPlayerViewController else {
                return nil
        }
        return avPlayerViewController
    }
}
