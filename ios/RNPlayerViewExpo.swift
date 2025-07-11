import BitmovinPlayer
import ExpoModulesCore

public class RNPlayerViewExpo: ExpoView {
    let playerView: PlayerView
    private var customMessageHandlerBridgeId: NativeId?
    internal var config: RNPlayerViewConfig?

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
        let playerViewConfig = config?.playerViewConfig ?? PlayerViewConfig()
        self.playerView = PlayerView(
            player: PlayerFactory.create(playerConfig: PlayerConfig()),
            frame: .zero,
            playerViewConfig: playerViewConfig
        )
        super.init(appContext: appContext)
        clipsToBounds = true
        addSubview(playerView)
    }

    override public func layoutSubviews() {
        playerView.frame = bounds
    }

    internal func attachPlayer(playerId: NativeId?, playerConfig: [String: Any]?) {
        guard let playerId else {
            playerView.player?.remove(listener: self)
            playerView.player = nil
            return
        }
        guard let player = self.appContext?.moduleRegistry.get(PlayerExpoModule.self)?.retrieve(playerId) else {
            return
        }

        if let userInterfaceConfig = maybeCreateUserInterfaceConfig(
            styleConfig: player.config.styleConfig,
            playerViewConfig: config
        ) {
            player.config.styleConfig.userInterfaceConfig = userInterfaceConfig
        }

        let previousPictureInPictureAvailableValue = playerView.isPictureInPictureAvailable
        playerView.player = player

        player.add(listener: self)
        playerView.add(listener: self)

        self.maybeEmitPictureInPictureAvailabilityEvent(
            previousState: previousPictureInPictureAvailableValue
        )
    }

    private func maybeCreateUserInterfaceConfig(
        styleConfig: StyleConfig,
        playerViewConfig: RNPlayerViewConfig?
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

            if let customMessageHandlerBridgeId = self.customMessageHandlerBridgeId,
               let customMessageHandlerBridgeModule = self.appContext?.moduleRegistry
                   .get(CustomMessageHandlerExpoModule.self),
               let customMessageHandlerBridge = customMessageHandlerBridgeModule
                   .retrieve(customMessageHandlerBridgeId) {
                bitmovinUserInterfaceConfig.customMessageHandler = customMessageHandlerBridge.customMessageHandler
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

    internal func attachFullscreenBridge(fullscreenBridgeId: NativeId) {
        guard let fullscreenBridgeModule = self.appContext?.moduleRegistry.get(FullscreenHandlerExpoModule.self),
              let fullscreenBridge = fullscreenBridgeModule.retrieve(fullscreenBridgeId) else {
            return
        }
        playerView.fullscreenHandler = fullscreenBridge
    }

    internal func setCustomMessageHandlerBridgeId(customMessageHandlerBridgeId: NativeId) {
        self.customMessageHandlerBridgeId = customMessageHandlerBridgeId
    }

    internal func setFullscreen(isFullscreen: Bool) {
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
        guard playerView.isPictureInPicture != enterPictureInPicture else {
            return
        }
        if enterPictureInPicture {
            playerView.enterPictureInPicture()
        } else {
            playerView.exitPictureInPicture()
        }
    }

    internal func setScalingMode(scalingMode: String) {
        switch scalingMode {
        case "Zoom":
            playerView.scalingMode = .zoom
        case "Stretch":
            playerView.scalingMode = .stretch
        case "Fit":
            playerView.scalingMode = .fit
        default:
            break
        }
    }

    @MainActor
    private func maybeEmitPictureInPictureAvailabilityEvent(previousState: Bool) {
        guard playerView.isPictureInPictureAvailable != previousState else {
            return
        }
        let event: [String: Any] = [
            "isPictureInPictureAvailable": playerView.isPictureInPictureAvailable,
            "name": "onPictureInPictureAvailabilityChanged",
            "timestamp": Date().timeIntervalSince1970
        ]

        sendEvent("onBmpPictureInPictureAvailabilityChanged", event)
    }
}

private extension RNPlayerViewExpo {
    func sendEvent<T: Event>(_ name: String, _ event: T) {
        guard let payload = event as? JsonConvertible else { return }
        sendEvent(name, payload.toJSON())
    }

    func sendEvent(_ name: String, _ payload: [AnyHashable: Any]) {
        appContext?.eventEmitter?.sendEvent(withName: name, body: payload)
    }
}

extension RNPlayerViewExpo: PlayerListener {
    public func onPlayerActive(_ event: PlayerActiveEvent, player: Player) {
        sendEvent("onPlayerActive", event)
    }

    public func onPlayerError(_ event: PlayerErrorEvent, player: Player) {
        sendEvent("onPlayerError", event)
    }

    public func onPlayerWarning(_ event: PlayerWarningEvent, player: Player) {
        sendEvent("onPlayerWarning", event)
    }

    public func onDestroy(_ event: DestroyEvent, player: Player) {
        sendEvent("onDestroy", event)
    }

    public func onMuted(_ event: MutedEvent, player: Player) {
        sendEvent("onMuted", event)
    }

    public func onUnmuted(_ event: UnmutedEvent, player: Player) {
        sendEvent("onUnmuted", event)
    }

    public func onReady(_ event: ReadyEvent, player: Player) {
        sendEvent("onReady", event)
    }

    public func onPaused(_ event: PausedEvent, player: Player) {
        sendEvent("onPaused", event)
    }

    public func onPlay(_ event: PlayEvent, player: Player) {
        sendEvent("onPlay", event)
    }

    public func onPlaying(_ event: PlayingEvent, player: Player) {
        sendEvent("onPlaying", event)
    }

    public func onPlaybackFinished(_ event: PlaybackFinishedEvent, player: Player) {
        sendEvent("onPlaybackFinished", event)
    }

    public func onSeek(_ event: SeekEvent, player: Player) {
        sendEvent("onSeek", event)
    }

    public func onSeeked(_ event: SeekedEvent, player: Player) {
        sendEvent("onSeeked", event)
    }

    public func onTimeShift(_ event: TimeShiftEvent, player: Player) {
        sendEvent("onTimeShift", event)
    }

    public func onTimeShifted(_ event: TimeShiftedEvent, player: Player) {
        sendEvent("onTimeShifted", event)
    }

    public func onStallStarted(_ event: StallStartedEvent, player: Player) {
        sendEvent("onStallStarted", event)
    }

    public func onStallEnded(_ event: StallEndedEvent, player: Player) {
        sendEvent("onStallEnded", event)
    }

    public func onTimeChanged(_ event: TimeChangedEvent, player: Player) {
        sendEvent("onTimeChanged", event)
    }

    public func onPlaybackSpeedChanged(_ event: PlaybackSpeedChangedEvent, player: Player) {
        sendEvent("onPlaybackSpeedChanged", event)
    }

    public func onSourceLoad(_ event: SourceLoadEvent, player: Player) {
        sendEvent("onSourceLoad", event)
    }

    public func onSourceLoaded(_ event: SourceLoadedEvent, player: Player) {
        sendEvent("onSourceLoaded", event)
    }

    public func onSourceUnloaded(_ event: SourceUnloadedEvent, player: Player) {
        sendEvent("onSourceUnloaded", event)
    }

    public func onSourceError(_ event: SourceErrorEvent, player: Player) {
        sendEvent("onSourceError", event)
    }

    public func onSourceWarning(_ event: SourceWarningEvent, player: Player) {
        sendEvent("onSourceWarning", event)
    }

    public func onAudioAdded(_ event: AudioAddedEvent, player: Player) {
        sendEvent("onAudioAdded", event)
    }

    public func onAudioRemoved(_ event: AudioRemovedEvent, player: Player) {
        sendEvent("onAudioRemoved", event)
    }

    public func onAudioChanged(_ event: AudioChangedEvent, player: Player) {
        sendEvent("onAudioChanged", event)
    }

    public func onSubtitleAdded(_ event: SubtitleAddedEvent, player: Player) {
        sendEvent("onSubtitleAdded", event)
    }

    public func onSubtitleRemoved(_ event: SubtitleRemovedEvent, player: Player) {
        sendEvent("onSubtitleRemoved", event)
    }

    public func onSubtitleChanged(_ event: SubtitleChangedEvent, player: Player) {
        sendEvent("onSubtitleChanged", event)
    }

    public func onDownloadFinished(_ event: DownloadFinishedEvent, player: Player) {
        sendEvent("onDownloadFinished", event)
    }

    public func onAdBreakFinished(_ event: AdBreakFinishedEvent, player: Player) {
        sendEvent("onAdBreakFinished", event)
    }

    public func onAdBreakStarted(_ event: AdBreakStartedEvent, player: Player) {
        sendEvent("onAdBreakStarted", event)
    }

    public func onAdClicked(_ event: AdClickedEvent, player: Player) {
        sendEvent("onAdClicked", event)
    }

    public func onAdError(_ event: AdErrorEvent, player: Player) {
        sendEvent("onAdError", event)
    }

    public func onAdFinished(_ event: AdFinishedEvent, player: Player) {
        sendEvent("onAdFinished", event)
    }

    public func onAdManifestLoad(_ event: AdManifestLoadEvent, player: Player) {
        sendEvent("onAdManifestLoad", event)
    }

    public func onAdManifestLoaded(_ event: AdManifestLoadedEvent, player: Player) {
        sendEvent("onAdManifestLoaded", event)
    }

    public func onAdQuartile(_ event: AdQuartileEvent, player: Player) {
        sendEvent("onAdQuartile", event)
    }

    public func onAdScheduled(_ event: AdScheduledEvent, player: Player) {
        sendEvent("onAdScheduled", event)
    }

    public func onAdSkipped(_ event: AdSkippedEvent, player: Player) {
        sendEvent("onAdSkipped", event)
    }

    public func onAdStarted(_ event: AdStartedEvent, player: Player) {
        sendEvent("onAdStarted", event)
    }

    public func onVideoDownloadQualityChanged(_ event: VideoDownloadQualityChangedEvent, player: Player) {
        sendEvent("onVideoDownloadQualityChanged", event)
     }

    public func onVideoPlaybackQualityChanged(_ event: VideoPlaybackQualityChangedEvent, player: Player) {
        sendEvent("onVideoPlaybackQualityChanged", event)
    }

    public func onCueEnter(_ event: CueEnterEvent, player: Player) {
        sendEvent("onCueEnter", event)
    }

    public func onCueExit(_ event: CueExitEvent, player: Player) {
        sendEvent("onCueExit", event)
    }

#if os(iOS)
    public func onCastAvailable(_ event: CastAvailableEvent, player: Player) {
        sendEvent("onCastAvailable", event)
    }

    public func onCastPaused(_ event: CastPausedEvent, player: Player) {
        sendEvent("onCastPaused", event)
    }

    public func onCastPlaybackFinished(_ event: CastPlaybackFinishedEvent, player: Player) {
        sendEvent("onCastPlaybackFinished", event)
    }

    public func onCastPlaying(_ event: CastPlayingEvent, player: Player) {
        sendEvent("onCastPlaying", event)
    }

    public func onCastStarted(_ event: CastStartedEvent, player: Player) {
        sendEvent("onCastStarted", event)
    }

    public func onCastStart(_ event: CastStartEvent, player: Player) {
        sendEvent("onCastStart", event)
    }

    public func onCastStopped(_ event: CastStoppedEvent, player: Player) {
        sendEvent("onCastStopped", event)
    }

    public func onCastTimeUpdated(_ event: CastTimeUpdatedEvent, player: Player) {
        sendEvent("onCastTimeUpdated", event)
    }
    func onCastWaitingForDevice(_ event: CastWaitingForDeviceEvent, player: Player) {
        sendEvent("onCastWaitingForDevice", event)
    }
#endif
}

extension RNPlayerViewExpo: UserInterfaceListener {
    public func onPictureInPictureEnter(_ event: PictureInPictureEnterEvent, view: PlayerView) {
        sendEvent("onPictureInPictureEnter", event)
    }

    public func onPictureInPictureEntered(_ event: PictureInPictureEnteredEvent, view: PlayerView) {
        sendEvent("onPictureInPictureEntered", event)
    }

    public func onPictureInPictureExit(_ event: PictureInPictureExitEvent, view: PlayerView) {
        sendEvent("onPictureInPictureExit", event)
    }

    public func onPictureInPictureExited(_ event: PictureInPictureExitedEvent, view: PlayerView) {
        sendEvent("onPictureInPictureExited", event)
    }

    public func onFullscreenEnter(_ event: FullscreenEnterEvent, view: PlayerView) {
        sendEvent("onFullscreenEnter", event)
    }

    public func onFullscreenExit(_ event: FullscreenExitEvent, view: PlayerView) {
        sendEvent("onFullscreenExit", event)
    }

    public func onFullscreenEnabled(_ event: FullscreenEnabledEvent, view: PlayerView) {
        sendEvent("onFullscreenEnabled", event)
    }

    public func onFullscreenDisabled(_ event: FullscreenDisabledEvent, view: PlayerView) {
        sendEvent("onFullscreenDisabled", event)
    }

    public func onEvent(_ event: any Event, player: any Player) {
        sendEvent("onBmpEvent", event)
    }
}
