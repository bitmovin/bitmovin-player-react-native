import BitmovinPlayer
import BitmovinPlayerCore
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
            if let isPictureInPictureEnabledValue {
                playerView.pictureInPicture.isEnabled = isPictureInPictureEnabledValue
            }
            if let pictureInPictureActions {
                updatePictureInPictureActions(actions: pictureInPictureActions)
            }
        }
    }

    private var customMessageHandlerBridgeId: NativeId?
    private var playerId: NativeId?
    private var fullscreenBridgeId: NativeId?
    private var scalingMode: ScalingMode?
    private var requestedFullscreenValue: Bool?
    private var requestedPictureInPictureValue: Bool?
    private var isPictureInPictureEnabledValue: Bool?
    private var pictureInPictureActions: [RNPictureInPictureAction]?
    private var avPlayerViewControllerTransitionForced = false
    private var shouldExitPictureInPictureOnForeground = false
    private var foregroundObserver: NSObjectProtocol?

    let onBmpPlayerViewReady = EventDispatcher()
    let onBmpPictureInPictureEnter = EventDispatcher()
    let onBmpPictureInPictureEntered = EventDispatcher()
    let onBmpPictureInPictureExit = EventDispatcher()
    let onBmpPictureInPictureExited = EventDispatcher()
    let onBmpFullscreenEnabled = EventDispatcher()
    let onBmpFullscreenDisabled = EventDispatcher()
    let onBmpFullscreenEnter = EventDispatcher()
    let onBmpFullscreenExit = EventDispatcher()
    let onBmpPictureInPictureAvailabilityChanged = EventDispatcher()

    required init(appContext: AppContext? = nil) {
        super.init(appContext: appContext)
        clipsToBounds = true
    }

    deinit {
        if let foregroundObserver {
            NotificationCenter.default.removeObserver(foregroundObserver)
        }
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
            detachCurrentPlayer()
            return
        }
        // PlayerView renders this native view only after player.initialize() resolves,
        // so the player is already registered on the normal attachment path.
        guard let player = self.appContext?.moduleRegistry.get(PlayerModule.self)?.retrieve(playerId) else {
            return
        }
        if let playerView, let currentPlayer = playerView.player, currentPlayer === player {
            // Player is already attached to the PlayerView
            return
        }

        if let userInterfaceConfig = maybeCreateUserInterfaceConfig(
            styleConfig: player.config.styleConfig,
            playerViewConfig: playerViewConfigWrapper,
            customMessageHandlerBridgeId: customMessageHandlerBridgeId
        ) {
            player.config.styleConfig.userInterfaceConfig = userInterfaceConfig
        }

        let previousPictureInPictureAvailableValue = playerView?.isPictureInPictureAvailable ?? false
        if playerView?.player != nil {
            prepareForNewPlayerAttachment()
        }
        self.playerView = PlayerView(
            player: player,
            frame: bounds,
            playerViewConfig: playerViewConfigWrapper?.playerViewConfig ?? PlayerViewConfig()
        )

        playerView?.add(listener: self)

        shouldExitPictureInPictureOnForeground =
            playerViewConfigWrapper?.pictureInPictureConfig?.shouldExitOnForeground ?? false
        updateForegroundObserver()

        self.maybeEmitPictureInPictureAvailabilityEvent(
            previousState: previousPictureInPictureAvailableValue
        )
        onBmpPlayerViewReady(["playerId": playerId])
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

    internal func updatePictureInPictureActions(actions: [RNPictureInPictureAction]?) {
        guard let actions else {
            return
        }
        pictureInPictureActions = actions
        guard let playerView else { return }
#if os(iOS)
        playerView.pictureInPicture.showSkipControls = actions.contains(.seek)
        playerView.tweaks.hidePlaybackControlsInPictureInPicture = !actions.contains(.togglePlayback)
#endif
    }

    internal func setIsPictureInPictureEnabled(_ isEnabled: Bool) {
        isPictureInPictureEnabledValue = isEnabled
        playerView?.pictureInPicture.isEnabled = isEnabled
    }
}

private extension RNPlayerView {
    func detachCurrentPlayer() {
        guard let playerView else {
            return
        }
        playerView.remove(listener: self)
        playerView.player = nil
        shouldExitPictureInPictureOnForeground = false
        updateForegroundObserver()
    }

    func updateForegroundObserver() {
        if let foregroundObserver {
            NotificationCenter.default.removeObserver(foregroundObserver)
            self.foregroundObserver = nil
        }
        guard shouldExitPictureInPictureOnForeground else { return }
#if os(iOS)
        foregroundObserver = NotificationCenter.default.addObserver(
            forName: UIApplication.didBecomeActiveNotification,
            object: nil,
            queue: .main
        ) { [weak self] _ in
            guard let self, self.playerView?.isPictureInPicture == true else { return }
            self.playerView?.exitPictureInPicture()
        }
#endif
    }

    func prepareForNewPlayerAttachment() {
        guard let playerView else {
            return
        }

        // Avoid carrying over fullscreen/PiP state to a new player.
        // Native PlayerView replaces its UI controller when the player instance changes, and does not
        // support preserving fullscreen/PiP state across that swap. We tear down first to avoid stale state.
        if playerView.isFullscreen {
            playerView.exitFullscreen()
        }
        if playerView.isPictureInPicture {
            playerView.exitPictureInPicture()
        }

        detachCurrentPlayer()

        // Force a fresh PlayerView on next attach.
        self.playerView = nil
    }
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
                bitmovinUserInterfaceConfig.enableWebViewInspecting = uiConfig.enableWebViewInspecting
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
